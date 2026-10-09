const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { status, severity, search } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) { where.push(`i.status = $${idx++}::varchar`); params.push(status); }
    if (severity) { where.push(`i.severity = $${idx++}::varchar`); params.push(severity); }
    if (search) {
      where.push(`(i.title ILIKE $${idx}::text OR i.code ILIKE $${idx}::text)`);
      params.push(`%${search}%`); idx++;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await pool.query(
      `SELECT i.*, u.full_name AS analyst_name, a.title AS alert_title
       FROM investigations i
       LEFT JOIN users u ON i.assigned_to = u.id
       LEFT JOIN alerts a ON i.alert_id = a.id
       ${whereClause}
       ORDER BY i.started_at DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM investigations');
    const investigating = await pool.query("SELECT COUNT(*) FROM investigations WHERE status = 'investigating'");
    const resolved = await pool.query("SELECT COUNT(*) FROM investigations WHERE status = 'resolved'");
    const critical = await pool.query("SELECT COUNT(*) FROM investigations WHERE severity = 'critical'");

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        investigating: parseInt(investigating.rows[0].count),
        resolved: parseInt(resolved.rows[0].count),
        critical: parseInt(critical.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status, resolution } = req.body;

    await pool.query(
      `UPDATE investigations
       SET progress = COALESCE($1::int, progress),
           status = COALESCE($2::varchar, status),
           resolution = COALESCE($3::text, resolution),
           resolved_at = CASE WHEN $2::varchar = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = $4::int`,
      [progress, status, resolution, id]
    );

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
