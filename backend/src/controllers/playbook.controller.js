const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM playbooks ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM playbooks');
    const runs = await pool.query('SELECT SUM(run_count) as total FROM playbooks');
    const critical = await pool.query("SELECT COUNT(*) FROM playbooks WHERE severity = 'critical'");

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        totalRuns: parseInt(runs.rows[0].total || 0),
        critical: parseInt(critical.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Chạy playbook
exports.run = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pb = await pool.query('SELECT * FROM playbooks WHERE id = $1::int', [id]);
    if (pb.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy playbook' });

    const runResult = await pool.query(
      `INSERT INTO playbook_runs (playbook_id, started_by, status)
       VALUES ($1::int, $2::int, 'running') RETURNING id`,
      [id, userId]
    );

    await pool.query(
      `UPDATE playbooks SET run_count = run_count + 1 WHERE id = $1::int`,
      [id]
    );

    // Simulate completion after 3s
    setTimeout(async () => {
      await pool.query(
        `UPDATE playbook_runs SET status = 'success', finished_at = NOW() WHERE id = $1::int`,
        [runResult.rows[0].id]
      );
    }, 3000);

    res.json({ success: true, message: 'Playbook đang chạy', run_id: runResult.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
