const pool = require('../config/database');

exports.getAlerts = async (req, res) => {
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

exports.createAlert = async (req, res) => {
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
