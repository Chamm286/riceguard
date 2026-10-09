const pool = require("../config/database");

// Cache in-memory để giảm query DB
const geoCache = new Map();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

// Lấy IP thật từ Cloudflare hoặc Express
function getRealIP(req) {
  return (
    req.headers["cf-connecting-ip"] ||       // Cloudflare
    req.headers["x-real-ip"] ||              // Nginx proxy
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||  // Proxy chain
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

// Chuẩn hóa IP (bỏ IPv6 prefix)
function normalizeIP(ip) {
  if (!ip) return "unknown";
  if (ip === "::1" || ip === "127.0.0.1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}

// Tra geolocation qua ipapi.co
async function lookupGeo(ip) {
  // Skip IP private
  if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return { country: "LOCAL", country_name: "Local", city: "Local", isp: "Local Network" };
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "RiceGuard/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const geo = {
      country: data.country_code || "??",
      country_name: data.country_name || "Unknown",
      region: data.region || "",
      city: data.city || "",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      timezone: data.timezone || "",
      isp: data.org || "",
      org: data.org || "",
    };

    geoCache.set(ip, { data: geo, timestamp: Date.now() });
    return geo;
  } catch (err) {
    console.error(`⚠️  Geo lookup failed for ${ip}:`, err.message);
    return { country: "??", country_name: "Unknown", city: "", isp: "" };
  }
}

// Lưu/cập nhật geolocation vào DB
async function saveGeoToDB(ip, geo) {
  try {
    await pool.query(
      `INSERT INTO ip_geolocation (ip_address, country, country_name, region, city, latitude, longitude, timezone, isp, org, lookup_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, NOW())
       ON CONFLICT (ip_address) DO UPDATE SET
         lookup_count = ip_geolocation.lookup_count + 1,
         country = COALESCE(EXCLUDED.country, ip_geolocation.country),
         country_name = COALESCE(EXCLUDED.country_name, ip_geolocation.country_name),
         region = COALESCE(EXCLUDED.region, ip_geolocation.region),
         city = COALESCE(EXCLUDED.city, ip_geolocation.city),
         latitude = COALESCE(EXCLUDED.latitude, ip_geolocation.latitude),
         longitude = COALESCE(EXCLUDED.longitude, ip_geolocation.longitude),
         timezone = COALESCE(EXCLUDED.timezone, ip_geolocation.timezone),
         isp = COALESCE(EXCLUDED.isp, ip_geolocation.isp),
         org = COALESCE(EXCLUDED.org, ip_geolocation.org),
         updated_at = NOW()`,
      [ip, geo.country, geo.country_name, geo.region, geo.city, geo.latitude, geo.longitude, geo.timezone, geo.isp, geo.org]
    );
  } catch (err) {
    console.error("⚠️  Save geo DB failed:", err.message);
  }
}

// Log request vào bảng logs
async function logRequest(req, ip, geo) {
  try {
    const ua = (req.headers["user-agent"] || "").substring(0, 500);
    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, message, raw_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        "web_visitor",
        "page_view",
        "info",
        ip,
        `${req.method} ${req.originalUrl} - ${ua.substring(0, 100)}`,
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          user_agent: ua,
          country: geo.country,
          city: geo.city,
          referer: req.headers.referer || "",
        }),
      ]
    );
  } catch (err) {
    console.error("⚠️  Log request failed:", err.message);
  }
}

// Middleware chính
async function trackVisitor(req, res, next) {
  // Bỏ qua các request từ frontend nội bộ (localhost) để tránh spam
  const skipPaths = [
    "/api/health", "/favicon.ico", "/_next", "/uploads",
    "/api/visitors", "/api/dashboard", "/api/logs", "/api/alerts",
    "/api/auth", "/api/notifications", "/api/reports", "/api/fields",
    "/api/threats", "/api/investigations", "/api/playbooks",
    "/api/compliance", "/api/assets", "/api/n8n", "/socket.io",
    "/api/workflows", "/api/cyber"
  ];
  if (skipPaths.some((p) => req.originalUrl.startsWith(p))) {
    return next();
  }

  // Chạy async, không block response
  const rawIP = getRealIP(req);
  const ip = normalizeIP(rawIP);

  // Log + geo lookup chạy ngầm
  (async () => {
    try {
      const geo = await lookupGeo(ip);
      await saveGeoToDB(ip, geo);
      await logRequest(req, ip, geo);

      // Gọi n8n workflow D2
      try {
        await fetch("http://localhost:5678/webhook/visitor-threat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip,
            country: geo.country,
            city: geo.city,
            isp: geo.isp,
            user_agent: req.headers["user-agent"] || "",
            path: req.originalUrl,
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(3000),
        });
      } catch (e) {
        // Silent fail
      }

      // Emit realtime cho admin đang xem
      if (global.io) {
        global.io.to("alerts").emit("new_visitor", {
          ip,
          path: req.originalUrl,
          user_agent: req.headers["user-agent"],
          country: geo.country,
          city: geo.city,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("❌ Track visitor error:", err.message);
    }
  })();

  next();
}

module.exports = { trackVisitor, getRealIP, normalizeIP };
