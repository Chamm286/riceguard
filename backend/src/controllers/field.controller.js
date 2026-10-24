const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const isAdmin = ['admin', 'analyst'].includes(req.user.role);
    const result = await pool.query(
      `SELECT f.*, u.full_name AS owner_name,
              (SELECT COUNT(*) FROM alerts a WHERE a.field_id = f.id AND a.status = 'new') AS active_alerts
       FROM fields f
       LEFT JOIN users u ON f.owner_id = u.id
       ${isAdmin ? '' : 'WHERE f.owner_id = $1'}
       ORDER BY f.created_at DESC`,
      isAdmin ? [] : [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'analyst'].includes(req.user.role);
    const result = await pool.query(
      `SELECT f.*, u.full_name AS owner_name
       FROM fields f LEFT JOIN users u ON f.owner_id = u.id
       WHERE f.id = $1 ${isAdmin ? '' : 'AND f.owner_id = $2'}`,
      isAdmin ? [id] : [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ruộng' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
