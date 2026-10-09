const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { status, type } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) { where.push(`status = $${idx++}::varchar`); params.push(status); }
    if (type) { where.push(`asset_type = $${idx++}::varchar`); params.push(type); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await pool.query(
      `SELECT a.*, f.name AS field_name
       FROM assets a
       LEFT JOIN fields f ON a.field_id = f.id
       ${whereClause}
       ORDER BY a.status, a.name`,
      params
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
    const result = await pool.query(
      `SELECT a.*, f.name AS field_name
       FROM assets a
       LEFT JOIN fields f ON a.field_id = f.id
       WHERE a.id = $1::int`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM assets');
    const online = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'online'");
    const warning = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'warning'");
    const offline = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'offline'");

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        online: parseInt(online.rows[0].count),
        warning: parseInt(warning.rows[0].count),
        offline: parseInt(offline.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
