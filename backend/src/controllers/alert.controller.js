const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { severity } = req.query;
    let q = 'SELECT * FROM alerts';
    const params = [];
    if (severity) { q += ' WHERE severity = $1'; params.push(severity); }
    q += ' ORDER BY created_at DESC LIMIT 200';
    const r = await pool.query(q, params);
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAlerts = exports.getAll;

exports.getById = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: r.rows[0] });
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
    const r = await pool.query(
      `INSERT INTO alerts (alert_type, category, severity, title, description, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new') RETURNING *`,
      [alert_type || 'security', category || 'security', severity, title, description || '', ip_address || null]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.createAlert = exports.create;

exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const r = await pool.query(
      `UPDATE alerts SET status = COALESCE($1, status), resolution_note = COALESCE($2, resolution_note), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status || null, note || null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
