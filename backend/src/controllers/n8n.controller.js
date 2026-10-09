const pool = require('../config/database');

// ============ N8N GỌI VÀO BACKEND ============

exports.updateAlertFromN8n = async (req, res) => {
  try {
    const { alert_id, status, note, action_taken } = req.body;
    if (!alert_id) return res.status(400).json({ success: false, message: 'Thiếu alert_id' });

    const current = await pool.query('SELECT status FROM alerts WHERE id = $1::int', [alert_id]);
    if (current.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy alert' });

    const oldStatus = current.rows[0].status;

    await pool.query(
      `UPDATE alerts SET status = COALESCE($1::varchar, status),
        updated_at = NOW(), resolution_note = COALESCE($2::text, resolution_note)
       WHERE id = $3::int`,
      [status || null, note || null, alert_id]
    );

    await pool.query(
      `INSERT INTO alert_history (alert_id, action, old_status, new_status, note)
       VALUES ($1::int, 'n8n_processed', $2::varchar, $3::varchar, $4::text)`,
      [alert_id, oldStatus, status || oldStatus, `[n8n] ${action_taken || note || "Xử lý tự động"}`]
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

    const existing = await pool.query('SELECT id FROM threats WHERE ip_address = $1::varchar', [ip_address]);

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE threats SET status = 'blocked', blocked_at = NOW(), notes = COALESCE($1::text, notes) WHERE ip_address = $2::varchar`,
        [reason || null, ip_address]
      );
    } else {
      await pool.query(
        `INSERT INTO threats (ip_address, threat_type, severity, status, blocked_at, notes)
         VALUES ($1::varchar, 'n8n_detected', 'high', 'blocked', NOW(), $2::text)`,
        [ip_address, reason || 'Blocked by n8n workflow']
      );
    }

    res.json({ success: true, message: `Đã block IP ${ip_address}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.createNotificationFromN8n = async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Thiếu title' });

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1::int, $2::varchar, $3::text, $4::varchar) RETURNING id`,
      [user_id || 1, title, message || '', type || 'system']
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.logWorkflowRun = async (req, res) => {
  try {
    const { workflow_id, status, execution_count } = req.body;

    await pool.query(
      `UPDATE n8n_workflows
       SET last_run = NOW(),
           execution_count = COALESCE($1::int, execution_count + 1),
           status = COALESCE($2::varchar, status)
       WHERE id = $3::int OR workflow_id = $4::varchar`,
      [execution_count || null, status || null, workflow_id || 0, workflow_id || '']
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============ BACKEND GỌI RA N8N ============

exports.triggerN8nWebhook = async (webhookPath, payload) => {
  try {
    // Dùng IP máy Linux vì backend chạy ngoài Docker
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    const url = `${n8nUrl}/${webhookPath}`;

    console.log(`[n8n] Trigger: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`[n8n] Response: ${response.status}`);
    return { success: true, status: response.status };
  } catch (err) {
    console.error('[n8n] Lỗi:', err.message);
    return { success: false, error: err.message };
  }
};
