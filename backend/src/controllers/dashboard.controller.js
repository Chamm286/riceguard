const pool = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const totalAlerts = await pool.query('SELECT COUNT(*) FROM alerts');
    const newAlerts = await pool.query("SELECT COUNT(*) FROM alerts WHERE status = 'new'");
    const criticalAlerts = await pool.query("SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND status != 'resolved'");
    const resolvedAlerts = await pool.query("SELECT COUNT(*) FROM alerts WHERE status = 'resolved'");
    const totalLogs = await pool.query('SELECT COUNT(*) FROM logs');
    const totalFields = await pool.query('SELECT COUNT(*) FROM fields');

    res.json({
      success: true,
      data: {
        totalAlerts: parseInt(totalAlerts.rows[0].count),
        newAlerts: parseInt(newAlerts.rows[0].count),
        criticalAlerts: parseInt(criticalAlerts.rows[0].count),
        resolvedAlerts: parseInt(resolvedAlerts.rows[0].count),
        totalLogs: parseInt(totalLogs.rows[0].count),
        totalFields: parseInt(totalFields.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAlertsBySeverity = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT severity, COUNT(*) as count
      FROM alerts
      GROUP BY severity
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAlertsByCategory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM alerts
      GROUP BY category
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAlertsTimeline = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM alerts
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getRecentAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.title, a.severity, a.status, a.category, a.created_at,
             f.name AS field_name
      FROM alerts a
      LEFT JOIN fields f ON a.field_id = f.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAISummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        time_window,
        summary,
        top_threat,
        affected_targets,
        recommendation,
        risk_level,
        alert_count,
        threats_count,
        investigations_count,
        created_at
      FROM alerts_summary 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (!result.rows[0]) {
      return res.json({
        success: true,
        data: null,
        message: 'Chưa có AI summary. Đợi A9 chạy (5 phút/lần).'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('getAISummary error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
