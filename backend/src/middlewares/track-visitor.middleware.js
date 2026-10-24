const pool = require('../config/database');
const { getClientIP, normalizeIP, isPrivateIP } = require('../utils/client-ip');

const geoCache = new Map();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

function clientIP(req) {
  return req.clientIp || getClientIP(req);
}

async function lookupGeo(ip) {
  if (!ip || ip === 'unknown' || isPrivateIP(ip)) {
    return {
      country: 'LOCAL',
      country_name: 'Local',
      region: '',
      city: 'Local',
      latitude: null,
      longitude: null,
      timezone: '',
      isp: 'Local Network',
      org: 'Local Network',
    };
  }

  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { 'User-Agent': 'RiceGuard/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.reason || 'Geo lookup error');

    const geo = {
      country: data.country_code || '??',
      country_name: data.country_name || 'Unknown',
      region: data.region || '',
      city: data.city || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      timezone: data.timezone || '',
      isp: data.org || '',
      org: data.org || '',
    };

    geoCache.set(ip, { data: geo, timestamp: Date.now() });
    return geo;
  } catch (err) {
    console.error(`Geo lookup failed for ${ip}:`, err.message);
    return { country: '??', country_name: 'Unknown', region: '', city: '', latitude: null, longitude: null, timezone: '', isp: '', org: '' };
  }
}

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
    console.error('Save geo DB failed:', err.message);
  }
}

async function logRequest(req, ip, geo) {
  try {
    const ua = (req.headers['user-agent'] || '').substring(0, 500);
    const page = String(req.body?.path || req.headers.referer || '/').substring(0, 500);
    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, message, raw_data, created_at)
       VALUES ('web_visitor', 'page_view', 'info', $1, $2, $3, NOW())`,
      [
        ip,
        `${req.method} ${page} - ${ua.substring(0, 100)}`,
        JSON.stringify({
          method: req.method,
          path: page,
          user_agent: ua,
          country: geo.country,
          city: geo.city,
          referer: req.headers.referer || '',
        }),
      ]
    );
  } catch (err) {
    console.error('Log request failed:', err.message);
  }
}

async function trackVisitor(req, res, next) {
  const ip = clientIP(req);

  (async () => {
    try {
      const geo = await lookupGeo(ip);
      await saveGeoToDB(ip, geo);
      await logRequest(req, ip, geo);

      if (global.io) {
        global.io.to('alerts').emit('new_visitor', {
          ip,
          path: req.body?.path || req.originalUrl,
          user_agent: req.headers['user-agent'],
          country: geo.country,
          city: geo.city,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Track visitor error:', err.message);
    }
  })();

  next();
}

module.exports = { trackVisitor, getRealIP: clientIP, normalizeIP };
