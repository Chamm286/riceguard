const os = require('os');
const fs = require('fs');
const pool = require('../config/database');

const startedAt = Date.now();

function baseUrl(value, fallback) {
  return (value || fallback).replace(/\/+$/, '');
}

const N8N_URL = baseUrl(process.env.N8N_API_URL || process.env.N8N_URL, 'http://localhost:5678')
  .replace(/\/api\/v1$/, '');
const AI_URL = baseUrl(process.env.AI_URL, 'http://localhost:5001');
const FRONTEND_URL = baseUrl(process.env.FRONTEND_URL, 'http://localhost:3000');

async function probe(url, timeout = 2500) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: 'application/json' },
    });
    return {
      online: res.ok,
      statusCode: res.status,
      latencyMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      online: false,
      statusCode: null,
      latencyMs: Date.now() - start,
      error: err.name === 'TimeoutError' ? 'Timeout' : err.message,
      checkedAt: new Date().toISOString(),
    };
  }
}

function getDisk() {
  try {
    const stat = fs.statfsSync('/');
    const total = Number(stat.blocks) * Number(stat.bsize);
    const free = Number(stat.bfree) * Number(stat.bsize);
    const used = total - free;
    return {
      totalBytes: total,
      usedBytes: used,
      freeBytes: free,
      usedPercent: total ? Math.round((used / total) * 1000) / 10 : 0,
    };
  } catch (err) {
    return { totalBytes: 0, usedBytes: 0, freeBytes: 0, usedPercent: 0, error: err.message };
  }
}

function getMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalBytes: total,
    usedBytes: used,
    freeBytes: free,
    usedPercent: total ? Math.round((used / total) * 1000) / 10 : 0,
    processRssBytes: process.memoryUsage().rss,
  };
}

function getCpu() {
  const cpus = os.cpus();
  const load = os.loadavg();
  return {
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    load1: Math.round(load[0] * 100) / 100,
    load5: Math.round(load[1] * 100) / 100,
    load15: Math.round(load[2] * 100) / 100,
    usagePercent: cpus.length ? Math.min(100, Math.round((load[0] / cpus.length) * 1000) / 10) : 0,
  };
}

async function getDatabaseStatus() {
  const start = Date.now();
  try {
    const ping = await pool.query(
      `SELECT current_database() AS name, current_setting('server_version') AS version,
              pg_database_size(current_database()) AS size_bytes`
    );
    const latencyMs = Date.now() - start;
    return {
      online: true,
      latencyMs,
      name: ping.rows[0].name,
      version: ping.rows[0].version,
      sizeBytes: Number(ping.rows[0].size_bytes),
    };
  } catch (err) {
    return { online: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function getCounts() {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM alerts)::int AS alerts,
        (SELECT COUNT(*) FROM alerts WHERE created_at >= CURRENT_DATE)::int AS alerts_today,
        (SELECT COUNT(*) FROM logs)::int AS logs,
        (SELECT COUNT(*) FROM logs WHERE created_at >= CURRENT_DATE)::int AS logs_today,
        (SELECT COUNT(*) FROM reports)::int AS reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'pending')::int AS reports_pending,
        (SELECT COUNT(*) FROM threats)::int AS threats,
        (SELECT COUNT(*) FROM blocked_ips)::int AS blocked_ips,
        (SELECT COUNT(*) FROM n8n_workflows WHERE status = 'active')::int AS workflows_active,
        (SELECT COUNT(*) FROM workflow_logs WHERE created_at >= CURRENT_DATE)::int AS workflow_runs_today,
        (SELECT COUNT(*) FROM users)::int AS users,
        (SELECT COUNT(*) FROM fields)::int AS fields,
        (SELECT COUNT(*) FROM plots)::int AS plots
    `);
    return result.rows[0];
  } catch (err) {
    return { error: err.message };
  }
}

exports.getStatus = async (req, res) => {
  try {
    const [database, counts, n8n, ai, frontend] = await Promise.all([
      getDatabaseStatus(),
      getCounts(),
      probe(`${N8N_URL}/healthz`),
      probe(`${AI_URL}/api/health`),
      probe(FRONTEND_URL, 2000),
    ]);

    const uptimeSeconds = process.uptime();
    const memory = getMemory();
    const disk = getDisk();
    const cpu = getCpu();

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(uptimeSeconds),
        startedAt: new Date(startedAt).toISOString(),
        runtime: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        system: {
          hostname: os.hostname(),
          osUptimeSeconds: Math.floor(os.uptime()),
          cpu,
          memory,
          disk,
          loadAverage: os.loadavg(),
        },
        database,
        counts,
        services: [
          {
            id: 'backend',
            name: 'Backend API',
            port: Number(process.env.PORT) || 5000,
            online: true,
            latencyMs: 0,
            checkedAt: new Date().toISOString(),
          },
          {
            id: 'database',
            name: 'PostgreSQL',
            port: Number(process.env.DB_PORT) || 5432,
            online: database.online,
            latencyMs: database.latencyMs,
            statusCode: database.online ? 200 : null,
            error: database.error,
            checkedAt: new Date().toISOString(),
          },
          {
            id: 'n8n',
            name: 'n8n Automation',
            port: 5678,
            ...n8n,
          },
          {
            id: 'ai',
            name: 'AI Service',
            port: 5001,
            ...ai,
          },
          {
            id: 'frontend',
            name: 'Frontend Next.js',
            port: 3000,
            ...frontend,
          },
        ],
        integrations: {
          n8nApiConfigured: Boolean(process.env.N8N_API_KEY),
          n8nUrl: N8N_URL,
          aiUrl: AI_URL,
          frontendUrl: FRONTEND_URL,
          telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        },
      },
    });
  } catch (err) {
    console.error('getStatus error:', err);
    res.status(500).json({ success: false, message: 'Không thể lấy trạng thái hệ thống' });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const result = await pool.query(
      `(
        SELECT 'alert' AS kind, id, title AS message, severity, status,
               ip_address, created_at
        FROM alerts
        ORDER BY created_at DESC
        LIMIT $1
      )
      UNION ALL
      (
        SELECT 'log' AS kind, id, message, severity, event_type AS status,
               ip_address, created_at
        FROM logs
        ORDER BY created_at DESC
        LIMIT $1
      )
      UNION ALL
      (
        SELECT 'workflow' AS kind, id,
               COALESCE(message, workflow_id) AS message,
               CASE WHEN status IN ('error', 'failed') THEN 'high' ELSE 'info' END AS severity,
               status, NULL AS ip_address, created_at
        FROM workflow_logs
        ORDER BY created_at DESC
        LIMIT $1
      )
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getActivity error:', err);
    res.status(500).json({ success: false, message: 'Không thể lấy hoạt động hệ thống' });
  }
};
