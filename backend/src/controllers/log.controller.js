const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { severity, source, event_type, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];
    let idx = 1;

    if (severity) { where.push(`l.severity = $${idx++}`); params.push(severity); }
    if (source) { where.push(`l.source = $${idx++}`); params.push(source); }
    if (event_type) { where.push(`l.event_type = $${idx++}`); params.push(event_type); }
    if (search) {
      where.push(`(l.message ILIKE $${idx} OR l.ip_address ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM logs l ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT l.*, u.username, f.name AS field_name
       FROM logs l
       LEFT JOIN users u ON l.user_id = u.id
       LEFT JOIN fields f ON l.field_id = f.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT severity, COUNT(*) as count
      FROM logs
      GROUP BY severity
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
