const net = require('net');
const pool = require('../config/database');
const firewallService = require('../services/firewall.service');
const telegramService = require('../services/telegram.service');

const ALERT_SELECT = `
  SELECT a.*, u.full_name AS assigned_name, f.name AS field_name, f.location AS field_location
  FROM alerts a
  LEFT JOIN users u ON a.assigned_to = u.id
  LEFT JOIN fields f ON a.field_id = f.id
`;

function extractIP(text) {
  if (!text) return null;
  const match = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  return match && net.isIP(match[0]) ? match[0] : null;
}

async function getAlertWithRelations(id) {
  const result = await pool.query(`${ALERT_SELECT} WHERE a.id = $1`, [id]);
  return result.rows[0] || null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

exports.getAll = async (req, res) => {
  try {
    const { severity, status, search } = req.query;
    const where = [];
    const params = [];
    let index = 1;

    if (severity) {
      where.push(`a.severity = $${index++}`);
      params.push(severity);
    }
    if (status) {
      where.push(`a.status = $${index++}`);
      params.push(status);
    }
    if (search) {
      where.push(`(a.title ILIKE $${index} OR a.description ILIKE $${index} OR a.ip_address ILIKE $${index})`);
      params.push(`%${search}%`);
      index++;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `${ALERT_SELECT} ${whereClause} ORDER BY a.created_at DESC LIMIT 200`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAlerts = exports.getAll;

exports.getMine = async (req, res) => {
  try {
    const result = await pool.query(
      `${ALERT_SELECT}
       WHERE a.alert_type IN ('disease', 'agriculture')
         AND (f.owner_id = $1 OR a.field_id IS NULL)
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getById = async (req, res) => {
  try {
    const alert = await getAlertWithRelations(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: alert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.create = async (req, res) => {
  try {
    const { alert_type, category, severity, title, description, ip_address } = req.body;
    if (!title || !severity) {
      return res.status(400).json({ success: false, message: 'Thiếu title/severity' });
    }
    const result = await pool.query(
      `INSERT INTO alerts (alert_type, category, severity, title, description, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new') RETURNING *`,
      [alert_type || 'security', category || 'security', severity, title, description || '', ip_address || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.createAlert = exports.create;

exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['new', 'processing', 'resolved', 'ignored'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const result = await pool.query(
      `UPDATE alerts
       SET status = COALESCE($1, status),
           resolution_note = COALESCE($2, resolution_note),
           assigned_to = CASE WHEN $1 = 'processing' AND assigned_to IS NULL THEN $4 ELSE assigned_to END,
           resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
           resolved_by = CASE WHEN $1 = 'resolved' THEN $4 ELSE resolved_by END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [status || null, note || null, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const alert = await getAlertWithRelations(req.params.id);
    res.json({ success: true, data: alert, message: 'Đã cập nhật trạng thái cảnh báo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.assign = async (req, res) => {
  try {
    const alert = await getAlertWithRelations(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });

    const assignedTo = Number(req.body.assigned_to || req.user.id);
    if (!Number.isInteger(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Người xử lý không hợp lệ' });
    }

    const user = await pool.query('SELECT id, full_name, is_active FROM users WHERE id = $1', [assignedTo]);
    if (!user.rows.length || !user.rows[0].is_active) {
      return res.status(400).json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị khóa' });
    }

    await pool.query(
      `UPDATE alerts
       SET assigned_to = $1,
           status = CASE WHEN status = 'new' THEN 'processing' ELSE status END,
           updated_at = NOW()
       WHERE id = $2`,
      [assignedTo, req.params.id]
    );

    const updated = await getAlertWithRelations(req.params.id);
    res.json({
      success: true,
      data: updated,
      message: `Đã giao cảnh báo cho ${user.rows[0].full_name}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.blockIp = async (req, res) => {
  try {
    const alert = await getAlertWithRelations(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });

    const ip = req.body.ip || alert.ip_address || extractIP(`${alert.title} ${alert.description}`);
    if (!ip) return res.status(400).json({ success: false, message: 'Cảnh báo không có IP để block' });
    if (net.isIP(ip) === 0) return res.status(400).json({ success: false, message: 'IP không hợp lệ' });

    const saved = await firewallService.blockIP(ip, `Alert #${alert.id}: ${alert.title}`);
    const note = `[HỆ THỐNG] Đã block IP ${ip} lúc ${new Date().toISOString()}`;

    await pool.query(
      `UPDATE alerts
       SET resolution_note = CASE
             WHEN resolution_note IS NULL OR resolution_note = '' THEN $2
             ELSE resolution_note || E'\n' || $2
           END,
           updated_at = NOW()
       WHERE id = $1`,
      [alert.id, note]
    );

    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, user_id, message, raw_data)
       VALUES ('firewall', 'ip_blocked', $1, $2, $3, $4, $5)`,
      [alert.severity || 'high', ip, req.user.id, note, JSON.stringify({ alert_id: alert.id })]
    );

    res.json({
      success: true,
      ip,
      skipped: saved.skipped,
      message: saved.skipped ? `Bỏ qua IP localhost ${ip}` : `Đã block IP ${ip}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Không block được IP' });
  }
};

exports.notify = async (req, res) => {
  try {
    const alert = await getAlertWithRelations(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });

    const recipientIds = [alert.assigned_to, req.user.id].filter(Boolean);
    const recipient = await pool.query(
      `SELECT telegram_chat_id FROM users
       WHERE id = ANY($1::int[]) AND is_active = TRUE AND telegram_chat_id IS NOT NULL
       ORDER BY CASE WHEN id = $2::int THEN 0 ELSE 1 END`,
      [recipientIds, alert.assigned_to]
    );
    const chatId = recipient.rows[0]?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

    const text = [
      `🚨 <b>${escapeHtml(alert.title)}</b>`,
      `Mức độ: ${escapeHtml(alert.severity)}`,
      `Nguồn: ${escapeHtml(alert.ip_address || 'Không xác định')}`,
      `Trạng thái: ${escapeHtml(alert.status)}`,
      `Thời gian: ${new Date(alert.created_at).toLocaleString('vi-VN')}`,
    ].join('\n');

    try {
      await telegramService.sendTelegramMessage(text, chatId);
    } catch (err) {
      if (err.code === 'TELEGRAM_NOT_CONFIGURED' || err.code === 'TELEGRAM_CHAT_ID_MISSING') {
        return res.status(503).json({ success: false, code: err.code, message: err.message });
      }
      throw err;
    }

    await pool.query(
      `UPDATE alerts SET telegram_sent = TRUE, notified_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [alert.id]
    );

    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, user_id, message, raw_data)
       VALUES ('telegram', 'alert_notified', $1, $2, $3, $4, $5)`,
      [alert.severity || 'medium', alert.ip_address, req.user.id, `Đã gửi Telegram cho cảnh báo #${alert.id}`, JSON.stringify({ alert_id: alert.id })]
    );

    res.json({ success: true, message: 'Đã gửi thông báo Telegram' });
  } catch (err) {
    console.error('Lỗi gửi Telegram:', err.message);
    res.status(502).json({ success: false, message: 'Không gửi được thông báo Telegram' });
  }
};
