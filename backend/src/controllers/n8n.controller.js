const pool = require('../config/database');

exports.updateAlertFromN8n = async (req, res) => {
  try {
    const { alert_id, status, note, action_taken } = req.body;
    if (!alert_id) return res.status(400).json({ success: false, message: 'Thiếu alert_id' });

    const cur = await pool.query('SELECT status FROM alerts WHERE id = $1', [alert_id]);
    if (!cur.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy alert' });

    const oldStatus = cur.rows[0].status;
    await pool.query(
      `UPDATE alerts SET status = COALESCE($1, status), updated_at = NOW(),
        resolution_note = COALESCE($2, resolution_note) WHERE id = $3`,
      [status || null, note || null, alert_id]
    );
    await pool.query(
      `INSERT INTO alert_history (alert_id, action, old_status, new_status, note)
       VALUES ($1, 'n8n_processed', $2, $3, $4)`,
      [alert_id, oldStatus, status || oldStatus, `[n8n] ${action_taken || note || 'Xử lý tự động'}`]
    );
    res.json({ success: true, message: 'n8n đã cập nhật alert' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.blockIPFromN8n = async (req, res) => {
  try {
    const { ip_address, reason } = req.body;
    if (!ip_address) return res.status(400).json({ success: false, message: 'Thiếu ip_address' });

    await pool.query(
      `INSERT INTO blocked_ips (ip, reason, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (ip) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()`,
      [ip_address, reason || 'Blocked by n8n']
    );

    const ex = await pool.query('SELECT id FROM threats WHERE ip_address = $1', [ip_address]);
    if (ex.rows.length) {
      await pool.query(
        `UPDATE threats SET status = 'blocked', blocked_at = NOW(), notes = COALESCE($1, notes)
         WHERE ip_address = $2`,
        [reason || null, ip_address]
      );
    } else {
      await pool.query(
        `INSERT INTO threats (ip_address, threat_type, severity, status, blocked_at, notes)
         VALUES ($1, 'n8n_detected', 'high', 'blocked', NOW(), $2)`,
        [ip_address, reason || 'Blocked by n8n']
      );
    }
    res.json({ success: true, message: `Đã block IP ${ip_address}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const WORKFLOW_ALIASES = {
  'soc-alert-triage': '%SOC%',
  'rice-disease-diagnosis': '%Rice%Disease%',
  'sentinel-2-sync': '%Sentinel%',
  'daily-security-report': '%Daily%',
};

exports.saveLogFromN8n = async (req, res) => {
  try {
    const { workflow_id, status, execution_count, message } = req.body;
    const slug = workflow_id || 'unknown';
    const logStatus = status || 'success';

    await pool.query(
      `INSERT INTO workflow_logs (workflow_id, status, execution_count, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [slug, logStatus, execution_count || 1, message || '']
    );

    const alias = WORKFLOW_ALIASES[slug];
    if (alias) {
      const stats = await pool.query(
        `SELECT COUNT(*)::int AS total,
                MAX(created_at) AS last_run,
                ROUND(100.0 * COUNT(*) FILTER (WHERE status NOT IN ('error','failed')) / NULLIF(COUNT(*), 0), 1)::float AS success_rate
         FROM workflow_logs WHERE workflow_id = $1`,
        [slug]
      );
      const row = stats.rows[0];
      await pool.query(
        `UPDATE n8n_workflows
         SET last_run = $1,
             execution_count = $2,
             success_rate = COALESCE($3, success_rate)
         WHERE name ILIKE $4`,
        [row.last_run, row.total, row.success_rate, alias]
      );
    } else {
      await pool.query(
        `UPDATE n8n_workflows
         SET last_run = NOW(),
             execution_count = COALESCE($1, execution_count + 1),
             status = COALESCE($2, status)
         WHERE workflow_id = $3`,
        [execution_count || null, logStatus, slug]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
