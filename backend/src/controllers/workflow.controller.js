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
  };
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
  return res.status(501).json({
    success: false,
    message: 'n8n Public API không hỗ trợ trigger thủ công workflow không phải evaluation. Hãy dùng webhook hoặc giao diện n8n.',
  });
};
