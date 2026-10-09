const pool = require('../config/database');

// Lấy danh sách threats
exports.getAll = async (req, res) => {
  try {
    const { status, severity, search } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) { where.push(`status = $${idx++}::varchar`); params.push(status); }
    if (severity) { where.push(`severity = $${idx++}::varchar`); params.push(severity); }
    if (search) {
      where.push(`(ip_address ILIKE $${idx}::text OR threat_type ILIKE $${idx}::text)`);
      params.push(`%${search}%`); idx++;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await pool.query(
      `SELECT * FROM threats ${whereClause} ORDER BY last_seen DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Thống kê threats
exports.getStats = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM threats');
    const blocked = await pool.query("SELECT COUNT(*) FROM threats WHERE status = 'blocked'");
    const watching = await pool.query("SELECT COUNT(*) FROM threats WHERE status = 'watching'");
    const critical = await pool.query("SELECT COUNT(*) FROM threats WHERE severity = 'critical'");

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        blocked: parseInt(blocked.rows[0].count),
        watching: parseInt(watching.rows[0].count),
        critical: parseInt(critical.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Block IP
exports.block = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `UPDATE threats SET status = 'blocked', blocked_at = NOW(), blocked_by = $1::int WHERE id = $2::int`,
      [userId, id]
    );

    res.json({ success: true, message: 'Đã block IP thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Theo dõi IP
exports.watch = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE threats SET status = 'watching' WHERE id = $1::int`, [id]);
    res.json({ success: true, message: 'Đang theo dõi IP' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
