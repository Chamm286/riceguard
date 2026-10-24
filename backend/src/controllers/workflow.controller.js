const pool = require('../config/database');

function workflowSlug(name = '') {
  const value = name.toLowerCase();
  if (value.includes('soc')) return 'soc-alert-triage';
  if (value.includes('rice') || value.includes('disease') || value.includes('bệnh')) return 'rice-disease-diagnosis';
  if (value.includes('sentinel') || value.includes('vệ tinh')) return 'sentinel-2-sync';
  if (value.includes('daily') || value.includes('report') || value.includes('báo cáo')) return 'daily-security-report';
  return value.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function getLogStats() {
  const { rows } = await pool.query(`
    SELECT workflow_id,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status IN ('error', 'failed'))::int AS failed,
           COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
           MAX(created_at) AS last_run,
           ROUND(
             100.0 * COUNT(*) FILTER (WHERE status NOT IN ('error', 'failed')) / NULLIF(COUNT(*), 0),
             1
           )::float AS success_rate
    FROM workflow_logs
    GROUP BY workflow_id
  `);
  return rows;
}

function mergeLogStats(workflow, stats) {
  const slug = workflowSlug(workflow.name);
  const log = stats[slug];
  if (!log) {
    return {
      ...workflow,
      slug,
      last_run: workflow.last_run || null,
      execution_count: Number(workflow.execution_count) || 0,
      success_rate: Number(workflow.success_rate) || 0,
      failed_runs: 0,
      runs_today: 0,
    };
  }
  return {
    ...workflow,
    slug,
    last_run: log.last_run,
    execution_count: log.total,
    success_rate: log.success_rate ?? 0,
    failed_runs: log.failed,
    runs_today: log.today,
  };
}

function n8nConfig() {
  return {
    enabled: Boolean(process.env.N8N_API_KEY),
    baseUrl: (process.env.N8N_API_URL || 'http://localhost:5678/api/v1').replace(/\/+$/, ''),
    webhookBase: (process.env.N8N_URL || 'http://localhost:5678').replace(/\/+$/, '') + '/webhook',
  };
}

const WORKFLOW_META = {
  'soc-alert-triage': { name: '🟢 SOC Alert Triage', description: 'Phát hiện tấn công, block IP, cảnh báo Telegram', trigger_type: 'webhook' },
  'rice-disease-diagnosis': { name: '🌾 Rice Disease Diagnosis', description: 'Phân tích ảnh lá lúa bằng AI, cảnh báo nông dân', trigger_type: 'webhook' },
  'sentinel-2-sync': { name: '🛰️ Sentinel-2 Sync', description: 'Đồng bộ ảnh vệ tinh và phân tích sức khỏe cây trồng', trigger_type: 'webhook' },
  'daily-security-report': { name: '📊 Daily Security Report', description: 'Báo cáo bảo mật hàng ngày', trigger_type: 'cron' },
};

function webhookPath(live) {
  const node = (live?.nodes || []).find((item) => item.type === 'n8n-nodes-base.webhook');
  return node?.parameters?.path || null;
}

let lastRegistrySync = 0;

async function syncWorkflowRegistry({ force = false } = {}) {
  if (!n8nConfig().enabled) return { skipped: true, reason: 'N8N_NOT_CONFIGURED' };
  if (!force && Date.now() - lastRegistrySync < 60000) return { skipped: true, reason: 'CACHE' };

  const data = await n8nRequest('/workflows?limit=250');
  const liveWorkflows = data.data || data;
  const bySlug = new Map(liveWorkflows.map((item) => [workflowSlug(item.name), item]));
  const rows = await pool.query('SELECT id, name, workflow_id FROM n8n_workflows ORDER BY id');
  const changes = [];

  for (const row of rows.rows) {
    const live = bySlug.get(workflowSlug(row.name)) || liveWorkflows.find((item) => item.id === row.workflow_id);
    if (!live) continue;
    const slug = workflowSlug(live.name);
    const meta = WORKFLOW_META[slug] || {};
    const path = webhookPath(live);
    const webhookUrl = path ? `${n8nConfig().webhookBase}/${path}` : '';
    const status = live.active ? 'active' : 'paused';
    const triggerType = (live.nodes || []).some((item) => item.type === 'n8n-nodes-base.scheduleTrigger')
      ? 'cron'
      : (meta.trigger_type || 'webhook');

    const result = await pool.query(
      `UPDATE n8n_workflows
       SET workflow_id = $1::varchar,
           name = COALESCE($6::varchar, name),
           webhook_url = $2::varchar,
           status = $3::varchar,
           trigger_type = $4::varchar,
           updated_at = NOW()
       WHERE id = $5::int
       RETURNING id`,
      [live.id, webhookUrl, status, triggerType, row.id, meta.name || null]
    );
    if (result.rowCount) changes.push({ id: row.id, slug, workflow_id: live.id, webhook_url: webhookUrl, status });
  }

  lastRegistrySync = Date.now();
  return { skipped: false, changes };
}

async function buildRunPayload(slug) {
  if (slug === 'daily-security-report') return {};

  if (slug === 'sentinel-2-sync') {
    const field = await pool.query(
      `SELECT f.id, f.name, f.coordinates,
              (SELECT ndvi_avg FROM features WHERE field_id = f.id ORDER BY id DESC LIMIT 1) AS ndvi,
              (SELECT ndre_avg FROM features WHERE field_id = f.id ORDER BY id DESC LIMIT 1) AS ndre
       FROM fields f ORDER BY f.id LIMIT 1`
    );
    const row = field.rows[0];
    if (!row) return null;
    let lat = 16.05;
    let lng = 108.2;
    try {
      const coords = typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates;
      if (coords && typeof coords === 'object') {
        lat = Number(coords.lat ?? coords.latitude ?? lat);
        lng = Number(coords.lng ?? coords.lon ?? coords.longitude ?? lng);
      }
    } catch (_) {}
    return {
      field_id: row.id,
      field_name: row.name,
      lat,
      lng,
      ndvi: Number(row.ndvi ?? 0.5),
      ndre: Number(row.ndre ?? 0.3),
    };
  }

  if (slug === 'rice-disease-diagnosis') {
    const report = await pool.query(
      `SELECT id, title, image_url, field_id FROM reports
       WHERE image_url IS NOT NULL AND image_url <> ''
       ORDER BY id DESC LIMIT 1`
    );
    const row = report.rows[0];
    if (!row) return null;
    const base = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');
    const imageUrl = /^https?:\/\//i.test(row.image_url) ? row.image_url : `${base}${row.image_url}`;
    return { report_id: row.id, title: row.title, image_url: imageUrl, field_id: row.field_id };
  }

  return null;
}

async function n8nRequest(path, options = {}) {
  const config = n8nConfig();
  if (!config.enabled) {
    const err = new Error('Chưa cấu hình N8N_API_KEY cho Backend');
    err.code = 'N8N_NOT_CONFIGURED';
    throw err;
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(8000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || `n8n API lỗi ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function resolveLiveWorkflow(workflow) {
  const normalized = (value = '') => value.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
  const target = normalized(workflow.name);
  const data = await n8nRequest('/workflows?limit=250');
  const items = data.data || data;
  const match = items.find((item) => item.id === workflow.workflow_id)
    || items.find((item) => normalized(item.name) === target)
    || items.find((item) => normalized(item.name).includes(target) || target.includes(normalized(item.name)));
  return match;
}

exports.getAll = async (req, res) => {
  try {
    const { status, owner } = req.query;
    const where = [];
    const params = [];
    let idx = 1;

    if (status) { where.push(`status = $${idx++}::varchar`); params.push(status); }
    if (owner) { where.push(`owner = $${idx++}::varchar`); params.push(owner); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    await syncWorkflowRegistry().catch((err) => console.log(`⚠️ Không đồng bộ n8n registry: ${err.message}`));
    const [workflows, logs] = await Promise.all([
      pool.query(`SELECT * FROM n8n_workflows ${whereClause} ORDER BY id`, params),
      getLogStats(),
    ]);
    const stats = Object.fromEntries(logs.map((row) => [row.workflow_id, row]));
    const data = workflows.rows.map((w) => mergeLogStats(w, stats));

    res.json({
      success: true,
      data,
      meta: {
        liveControl: n8nConfig().enabled,
        source: 'n8n_workflows + workflow_logs',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getStats = async (req, res) => {
  try {
    await syncWorkflowRegistry().catch((err) => console.log(`⚠️ Không đồng bộ n8n registry: ${err.message}`));
    const [workflows, logs] = await Promise.all([
      pool.query('SELECT * FROM n8n_workflows ORDER BY id'),
      getLogStats(),
    ]);
    const stats = Object.fromEntries(logs.map((row) => [row.workflow_id, row]));
    const merged = workflows.rows.map((w) => mergeLogStats(w, stats));
    const totalExecutions = merged.reduce((sum, w) => sum + w.execution_count, 0);
    const totalRuns = merged.reduce((sum, w) => sum + w.execution_count, 0);
    const weightedSuccess = totalRuns
      ? Math.round((merged.reduce((sum, w) => sum + w.success_rate * w.execution_count, 0) / totalRuns) * 10) / 10
      : 0;

    res.json({
      success: true,
      data: {
        total: merged.length,
        active: merged.filter((w) => w.status === 'active').length,
        paused: merged.filter((w) => w.status === 'paused').length,
        errors: merged.filter((w) => w.status === 'error').length,
        totalExecutions,
        runsToday: merged.reduce((sum, w) => sum + w.runs_today, 0),
        successRate: weightedSuccess,
        liveControl: n8nConfig().enabled,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await pool.query('SELECT * FROM n8n_workflows WHERE id = $1::int', [id]);
    if (!workflow.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy workflow' });
    }

    const slug = workflowSlug(workflow.rows[0].name);
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const result = await pool.query(
      `SELECT id, workflow_id, status, execution_count, message, created_at
       FROM workflow_logs
       WHERE workflow_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [slug, limit]
    );
    res.json({ success: true, data: result.rows, meta: { slug } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM n8n_workflows WHERE id = $1::int', [id]);
    if (current.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const workflow = current.rows[0];
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';

    try {
      const live = await resolveLiveWorkflow(workflow);
      if (!live) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy workflow tương ứng trên n8n' });
      }
      await n8nRequest(`/workflows/${live.id}/${newStatus === 'active' ? 'activate' : 'deactivate'}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch (err) {
      if (err.code === 'N8N_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          message: 'Chưa cấu hình N8N_API_KEY nên không thể điều khiển workflow trực tiếp',
          code: err.code,
        });
      }
      return res.status(502).json({ success: false, message: `Không thể điều khiển n8n: ${err.message}` });
    }

    await pool.query('UPDATE n8n_workflows SET status = $1::varchar WHERE id = $2::int', [newStatus, id]);
    res.json({ success: true, message: `Đã ${newStatus === 'active' ? 'bật' : 'tắt'} workflow`, status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.run = async (req, res) => {
  const config = n8nConfig();
  if (!config.enabled) {
    return res.status(503).json({
      success: false,
      message: 'Chưa cấu hình N8N_API_KEY. Hãy chạy workflow từ giao diện n8n hoặc qua webhook tương ứng.',
      code: 'N8N_NOT_CONFIGURED',
    });
  }

  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM n8n_workflows WHERE id = $1::int', [id]);
    if (!current.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy workflow' });

    const workflow = current.rows[0];
    const slug = workflowSlug(workflow.name);
    if (slug === 'soc-alert-triage') {
      return res.status(400).json({
        success: false,
        message: 'SOC Alert Triage chạy tự động khi có sự kiện bảo mật. Không chạy thủ công để tránh tạo cảnh báo giả.',
      });
    }

    const payload = await buildRunPayload(slug);
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: slug === 'rice-disease-diagnosis'
          ? 'Chưa có báo cáo có ảnh để chạy chẩn đoán'
          : 'Chưa có dữ liệu ruộng/vệ tinh để chạy workflow',
      });
    }

    const live = await resolveLiveWorkflow(workflow);
    if (!live) return res.status(404).json({ success: false, message: 'Không tìm thấy workflow tương ứng trên n8n' });
    const path = webhookPath(live) || (workflow.webhook_url || '').split('/webhook/')[1];
    if (!path) {
      return res.status(400).json({ success: false, message: 'Workflow không có webhook để chạy thủ công' });
    }

    const response = await fetch(`${config.webhookBase}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body && Object.keys(req.body).length ? req.body : payload),
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.text();
    if (!response.ok) {
      return res.status(502).json({ success: false, message: `n8n webhook lỗi ${response.status}: ${body.slice(0, 200)}` });
    }

    res.status(202).json({
      success: true,
      message: `Đã gửi yêu cầu chạy ${workflow.name}`,
      data: { workflow: slug, payload, response: body.slice(0, 300) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: `Không thể chạy workflow: ${err.message}` });
  }
};

exports.sync = async (req, res) => {
  try {
    const result = await syncWorkflowRegistry({ force: true });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(502).json({ success: false, message: `Không đồng bộ được n8n: ${err.message}` });
  }
};

exports.syncWorkflowRegistry = syncWorkflowRegistry;
