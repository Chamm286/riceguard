const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { status, owner } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) { where.push(`status = $${idx++}::varchar`); params.push(status); }
    if (owner) { where.push(`owner = $${idx++}::varchar`); params.push(owner); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await pool.query(
      `SELECT * FROM n8n_workflows ${whereClause} ORDER BY id`,
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
    const total = await pool.query('SELECT COUNT(*) FROM n8n_workflows');
    const active = await pool.query("SELECT COUNT(*) FROM n8n_workflows WHERE status = 'active'");
    const paused = await pool.query("SELECT COUNT(*) FROM n8n_workflows WHERE status = 'paused'");
    const errors = await pool.query("SELECT COUNT(*) FROM n8n_workflows WHERE status = 'error'");
    const exec = await pool.query('SELECT SUM(execution_count) as total FROM n8n_workflows');

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        active: parseInt(active.rows[0].count),
        paused: parseInt(paused.rows[0].count),
        errors: parseInt(errors.rows[0].count),
        totalExecutions: parseInt(exec.rows[0].total || 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT status FROM n8n_workflows WHERE id = $1::int', [id]);
    if (current.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const newStatus = current.rows[0].status === 'active' ? 'paused' : 'active';
    await pool.query('UPDATE n8n_workflows SET status = $1::varchar WHERE id = $2::int', [newStatus, id]);

    res.json({ success: true, message: `Đã ${newStatus === 'active' ? 'bật' : 'tắt'} workflow`, status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.run = async (req, res) => {
  try {
    const { id } = req.params;
    // Update last_run + execution_count
    await pool.query(
      `UPDATE n8n_workflows SET last_run = NOW(), execution_count = execution_count + 1 WHERE id = $1::int`,
      [id]
    );
    res.json({ success: true, message: 'Đã trigger workflow' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
