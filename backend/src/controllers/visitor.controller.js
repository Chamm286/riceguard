const pool = require("../config/database");

// GET /api/visitors - List visitors with geo
exports.list = async (req, res) => {
  try {
    const { limit = 100, offset = 0, country, search } = req.query;

    let where = ["l.source = 'web_visitor'"];
    let params = [];
    let p = 1;

    if (country) {
      where.push(`g.country = $${p++}`);
      params.push(country);
    }
    if (search) {
      where.push(`(l.ip_address ILIKE $${p} OR g.city ILIKE $${p} OR g.isp ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    const query = `
      SELECT 
        l.id, l.ip_address, l.event_type, l.severity, l.message, l.created_at,
        g.country, g.country_name, g.city, g.region,
        g.latitude, g.longitude, g.isp, g.timezone,
        l.raw_data->>'user_agent' AS user_agent,
        l.raw_data->>'referer' AS referer
      FROM logs l
      LEFT JOIN ip_geolocation g ON g.ip_address = l.ip_address
      WHERE ${where.join(" AND ")}
      ORDER BY l.created_at DESC
      LIMIT $${p++} OFFSET $${p++}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int FROM logs WHERE source = 'web_visitor'`
    );

    res.json({
      success: true,
      total: countResult.rows[0].count,
      data: result.rows,
    });
  } catch (err) {
    console.error("❌ /visitors:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/stats - Thống kê
exports.stats = async (req, res) => {
  try {
    const total = await pool.query(`SELECT COUNT(*)::int AS c FROM logs WHERE source = 'web_visitor'`);
    const last24h = await pool.query(`SELECT COUNT(*)::int AS c FROM logs WHERE source = 'web_visitor' AND created_at > NOW() - INTERVAL '24 hours'`);
    
    const countries = await pool.query(`
      SELECT g.country, g.country_name, COUNT(l.id)::int AS count
      FROM logs l
      LEFT JOIN ip_geolocation g ON g.ip_address = l.ip_address
      WHERE l.source = 'web_visitor' AND g.country IS NOT NULL
      GROUP BY g.country, g.country_name
      ORDER BY count DESC LIMIT 10
    `);
    
    const topIPs = await pool.query(`
      SELECT l.ip_address, g.country, g.city, COUNT(*)::int AS hits
      FROM logs l
      LEFT JOIN ip_geolocation g ON g.ip_address = l.ip_address
      WHERE l.source = 'web_visitor'
      GROUP BY l.ip_address, g.country, g.city
      ORDER BY hits DESC LIMIT 10
    `);
    
    const suspicious = await pool.query(`
      SELECT COUNT(*)::int AS c FROM logs
      WHERE source = 'web_visitor'
      AND (
        (raw_data->>'user_agent') ILIKE '%bot%'
        OR (raw_data->>'user_agent') ILIKE '%scan%'
        OR (raw_data->>'user_agent') ILIKE '%sqlmap%'
      )
    `);
    
    const geoCount = await pool.query(`
      SELECT COUNT(DISTINCT country)::int AS c FROM ip_geolocation
      WHERE country IS NOT NULL AND country != '??' AND country != 'LOCAL'
    `);

    res.json({
      success: true,
      data: {
        totalVisitors: total.rows[0].c,
        last24h: last24h.rows[0].c,
        suspicious: suspicious.rows[0].c,
        countriesCount: geoCount.rows[0].c,
        countries: countries.rows,
        topIPs: topIPs.rows,
      },
    });
  } catch (err) {
    console.error("❌ /visitors/stats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/map - Tọa độ cho map
exports.map = async (req, res) => {
  try {
    // Lấy từ ip_geolocation (đã có tọa độ)
    const result = await pool.query(`
      SELECT 
        g.ip_address, g.country, g.country_name, g.city, g.region,
        g.latitude, g.longitude, g.isp, g.timezone, g.updated_at AS last_seen,
        COALESCE(
          (SELECT COUNT(*)::int FROM logs l WHERE l.ip_address = g.ip_address AND l.source = 'web_visitor'),
          0
        ) AS hits
      FROM ip_geolocation g
      WHERE g.latitude IS NOT NULL AND g.longitude IS NOT NULL
      ORDER BY g.updated_at DESC
      LIMIT 500
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ /visitors/map:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/suspicious - IP đáng ngờ
exports.suspicious = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.ip_address,
        g.country, g.country_name, g.city, g.isp,
        COUNT(*)::int AS hits,
        MAX(l.created_at) AS last_seen,
        array_agg(DISTINCT l.raw_data->>'user_agent') FILTER (WHERE l.raw_data->>'user_agent' IS NOT NULL) AS user_agents
      FROM logs l
      LEFT JOIN ip_geolocation g ON g.ip_address = l.ip_address
      WHERE l.source = 'web_visitor'
      AND (
        (l.raw_data->>'user_agent') ILIKE '%bot%'
        OR (l.raw_data->>'user_agent') ILIKE '%scan%'
        OR (l.raw_data->>'user_agent') ILIKE '%sqlmap%'
        OR (l.raw_data->>'user_agent') ILIKE '%nikto%'
        OR (l.raw_data->>'user_agent') ILIKE '%nmap%'
        OR l.event_type IN ('sql_injection', 'xss', 'path_traversal', 'brute_force')
      )
      GROUP BY l.ip_address, g.country, g.country_name, g.city, g.isp
      ORDER BY hits DESC
      LIMIT 50
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ /visitors/suspicious:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET /api/visitors/alerts - Alerts visitor
exports.visitorAlerts = async (req, res) => {
  try {
    const { limit = 50, severity } = req.query;
    let where = ["alert_type = 'visitor_suspicious'"];
    let params = [];
    let p = 1;
    
    if (severity) {
      where.push(`severity = $${p++}`);
      params.push(severity);
    }
    
    const query = `
      SELECT id, alert_type, category AS threat_type, severity, title, description,
             ip_address, status, created_at
      FROM alerts
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${p++}
    `;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    const statsResult = await pool.query(`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical,
        COUNT(*) FILTER (WHERE severity = 'high')::int AS high,
        COUNT(DISTINCT ip_address)::int AS unique_ips
      FROM alerts WHERE alert_type = 'visitor_suspicious'
    `);
    
    res.json({
      success: true,
      stats: statsResult.rows[0],
      data: result.rows,
    });
  } catch (err) {
    console.error("❌ /visitors/alerts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/visitors/geocode-missing - Tự động lookup IP chưa có tọa độ
exports.geocodeMissing = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ip_address FROM ip_geolocation 
      WHERE (latitude IS NULL OR longitude IS NULL)
      AND ip_address NOT LIKE '127.%'
      AND ip_address NOT LIKE '192.168.%'
      AND ip_address NOT LIKE '10.%'
      AND ip_address NOT LIKE '172.%'
      LIMIT 20
    `);

    let updated = 0;
    for (const row of result.rows) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${row.ip_address}/json/`, {
          headers: { "User-Agent": "RiceGuard/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (geoRes.ok) {
          const data = await geoRes.json();
          if (data.latitude && data.longitude) {
            await pool.query(`
              UPDATE ip_geolocation 
              SET latitude = $1, longitude = $2, 
                  country = COALESCE($3, country), 
                  country_name = COALESCE($4, country_name),
                  city = COALESCE($5, city),
                  region = COALESCE($6, region),
                  isp = COALESCE($7, isp),
                  updated_at = NOW()
              WHERE ip_address = $8
            `, [data.latitude, data.longitude, data.country_code, data.country_name, data.city, data.region, data.org, row.ip_address]);
            updated++;
          }
        }
      } catch (e) {
        console.error(`Geocode ${row.ip_address} failed:`, e.message);
      }
    }

    res.json({ success: true, updated, total: result.rows.length });
  } catch (err) {
    console.error("❌ /visitors/geocode-missing:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
