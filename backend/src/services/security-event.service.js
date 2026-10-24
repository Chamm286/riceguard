const pool = require('../config/database');

function webhookBase() {
  return (process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook').replace(/\/+$/, '');
}

function n8nEnabled() {
  return process.env.N8N_DISABLED !== 'true';
}

async function callWebhook(path, payload, timeout = 5000) {
  if (!n8nEnabled()) return { ok: false, skipped: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${webhookBase()}/${path.replace(/^\/+/, '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function createAlert(event) {
  const dedupeMinutes = Number(process.env.SECURITY_ALERT_DEDUPE_MINUTES || 5);
  const recent = await pool.query(
    `SELECT id FROM alerts
     WHERE title = $1 AND COALESCE(ip_address, 'unknown') = COALESCE($2, 'unknown')
       AND created_at > NOW() - ($3::int * INTERVAL '1 minute')
     LIMIT 1`,
    [event.title, event.ip || 'unknown', dedupeMinutes]
  );

  if (recent.rows.length) return { ...recent.rows[0], duplicate: true };

  const inserted = await pool.query(
    `INSERT INTO alerts (alert_type, category, severity, title, description, ip_address, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())
     RETURNING id, title, severity, description, created_at`,
    [event.type, event.category || 'security', event.severity || 'high', event.title, event.description || '', event.ip || 'unknown']
  );
  return inserted.rows[0];
}

async function sendSecurityEvent(event, options = {}) {
  const payload = {
    event_id: event.eventId || `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: String(event.severity || 'high').toUpperCase(),
    source: {
      ip: event.ip || 'unknown',
      country: event.country || 'Unknown',
      port: event.port || null,
      user_agent: event.userAgent || '',
    },
    target: {
      ip: process.env.SERVER_PUBLIC_IP || 'riceguard-api',
      service: event.service || 'HTTP',
      path: event.path || '',
    },
    threat_info: {
      type: event.category || event.type || 'security_event',
      description: event.description || '',
      recommendation: event.recommendation || 'Review and block source IP if malicious',
    },
    payload: event.description || '',
    status: 'NEW',
    ip: event.ip || 'unknown',
    type: event.type || event.category || 'security_event',
    path: event.path || '',
    message: event.description || '',
  };

  const result = await callWebhook('security-event', payload, options.timeout || 5000);

  if (!result.ok && options.fallbackAlert !== false) {
    const alert = await createAlert({
      type: event.alertType || 'security_event',
      category: event.category || 'security',
      severity: event.severity || 'high',
      title: event.title || `${event.type || 'Security event'} từ ${event.ip || 'unknown'}`,
      description: event.description || '',
      ip: event.ip,
    });
    return { ...result, fallbackAlert: alert };
  }

  return result;
}

module.exports = { sendSecurityEvent, callWebhook, createAlert, webhookBase };
