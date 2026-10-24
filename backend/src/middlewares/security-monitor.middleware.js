const pool = require('../config/database');
const { getClientIP, isPrivateIP } = require('../utils/client-ip');
const { detectAttack } = require('../utils/attack-patterns');
const { sendSecurityEvent } = require('../services/security-event.service');
const firewallService = require('../services/firewall.service');

const blockedCache = new Map();
const BLOCKED_TTL = 30 * 1000;

function blockedCacheGet(ip) {
  const cached = blockedCache.get(ip);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > BLOCKED_TTL) {
    blockedCache.delete(ip);
    return null;
  }
  return cached.blocked;
}

function blockedCacheSet(ip, blocked) {
  blockedCache.set(ip, { blocked, timestamp: Date.now() });
}

async function isBlocked(ip) {
  const cached = blockedCacheGet(ip);
  if (cached !== null) return cached;
  const result = await pool.query('SELECT 1 FROM blocked_ips WHERE ip = $1 LIMIT 1', [ip]);
  const blocked = result.rows.length > 0;
  blockedCacheSet(ip, blocked);
  return blocked;
}

async function recordThreat(ip, attack) {
  const existing = await pool.query('SELECT id, hits FROM threats WHERE ip_address = $1 LIMIT 1', [ip]);
  if (existing.rows.length) {
    await pool.query(
      `UPDATE threats
       SET hits = COALESCE(hits, 0) + 1,
           threat_type = $1,
           severity = $2,
           last_seen = NOW(),
           status = CASE WHEN status = 'blocked' THEN 'blocked' ELSE 'watching' END
       WHERE ip_address = $3`,
      [attack.type, attack.severity, ip]
    );
    return;
  }

  await pool.query(
    `INSERT INTO threats (ip_address, threat_type, severity, hits, status, last_seen, created_at)
     VALUES ($1, $2, $3, 1, 'watching', NOW(), NOW())`,
    [ip, attack.type, attack.severity]
  );
}

async function autoBlockIfNeeded(ip, attack) {
  if (process.env.SECURITY_AUTO_BLOCK === 'false') return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') return false;
  if (isPrivateIP(ip) && process.env.SECURITY_AUTO_BLOCK_PRIVATE !== 'true') return false;

  const threshold = Number(process.env.SECURITY_BLOCK_THRESHOLD || 5);
  const count = await pool.query(
    `SELECT COUNT(*)::int AS c FROM logs
     WHERE ip_address = $1 AND source = 'waf' AND created_at > NOW() - INTERVAL '10 minutes'`,
    [ip]
  );

  if ((count.rows[0]?.c || 0) < threshold) return false;

  try {
    await firewallService.blockIP(ip, `Auto-blocked after ${count.rows[0].c} WAF events (${attack.type})`);
    blockedCacheSet(ip, true);
    await pool.query(
      `UPDATE threats SET status = 'blocked', blocked_at = NOW() WHERE ip_address = $1`,
      [ip]
    );
    return true;
  } catch (err) {
    console.error('Auto-block failed:', err.message);
    return false;
  }
}

async function handleAttack(req, ip, attack) {
  const description = `${req.method} ${req.originalUrl} — ${attack.title}`;
  try {
    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, message, raw_data, created_at)
       VALUES ('waf', $1, $2, $3, $4, $5, NOW())`,
      [
        attack.type,
        attack.severity,
        ip,
        description,
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          user_agent: req.headers['user-agent'] || '',
          query: req.query || {},
          referer: req.headers.referer || '',
        }),
      ]
    );
    await recordThreat(ip, attack);
  } catch (err) {
    console.error('WAF log failed:', err.message);
  }

  if (global.io) {
    global.io.to('alerts').emit('new_log', {
      source: 'waf',
      event_type: attack.type,
      severity: attack.severity,
      ip_address: ip,
      message: description,
      created_at: new Date().toISOString(),
    });
  }

  const webhook = await sendSecurityEvent({
    eventId: `waf-${Date.now()}`,
    type: attack.type,
    category: attack.category,
    severity: attack.severity,
    title: `${attack.title} từ ${ip}`,
    description,
    ip,
    path: req.originalUrl,
    userAgent: req.headers['user-agent'] || '',
    alertType: 'waf_attack',
  });

  if (webhook.fallbackAlert && !webhook.fallbackAlert.duplicate && global.io) {
    global.io.to('alerts').emit('new_alert', webhook.fallbackAlert);
  }

  await autoBlockIfNeeded(ip, attack);
}

function securityMonitor(req, res, next) {
  const ip = getClientIP(req);
  req.clientIp = ip;

  isBlocked(ip)
    .then((blocked) => {
      if (blocked) {
        return res.status(403).json({
          success: false,
          message: 'IP của bạn đã bị chặn do vi phạm chính sách an ninh.',
          code: 'IP_BLOCKED',
        });
      }

      const attack = detectAttack(req);
      if (!attack) return next();

      req.securityEvent = attack;
      handleAttack(req, ip, attack).catch((err) => console.error('WAF handler failed:', err.message));

      return res.status(403).json({
        success: false,
        message: 'Yêu cầu bị chặn bởi hệ thống phòng chống tấn công.',
        code: 'WAF_BLOCKED',
        event: attack.type,
      });
    })
    .catch((err) => {
      console.error('Security monitor failed:', err.message);
      next();
    });
}

module.exports = { securityMonitor };
