const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT framework, category, json_agg(json_build_object('id', id, 'name', name, 'status', status)) AS items
       FROM compliance_checks
       GROUP BY framework, category
       ORDER BY framework, category`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM compliance_checks');
    const passed = await pool.query("SELECT COUNT(*) FROM compliance_checks WHERE status = 'passed'");
    const warning = await pool.query("SELECT COUNT(*) FROM compliance_checks WHERE status = 'warning'");
    const failed = await pool.query("SELECT COUNT(*) FROM compliance_checks WHERE status = 'failed'");

    const totalCount = parseInt(total.rows[0].count);
    const passedCount = parseInt(passed.rows[0].count);

    res.json({
      success: true,
      data: {
        total: totalCount,
        passed: passedCount,
        warning: parseInt(warning.rows[0].count),
        failed: parseInt(failed.rows[0].count),
        progress: Math.round((passedCount / totalCount) * 100),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getByFramework = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT framework, COUNT(*) as total,
              SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed
       FROM compliance_checks
       GROUP BY framework`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
