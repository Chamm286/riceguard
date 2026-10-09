const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middlewares/auth.middleware');

// GET /api/stats/sidebar - Badge counts từ DB
router.get('/sidebar', verifyToken, async (req, res) => {
  try {
    const [threats, alerts, investigations, visitorAlerts] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM threats WHERE status != 'resolved'`).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM alerts WHERE status = 'new'`).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM investigations WHERE status != 'resolved'`).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM alerts WHERE alert_type = 'visitor_suspicious' AND status = 'new'`).catch(() => ({ rows: [{ c: 0 }] })),
    ]);

    res.json({
      success: true,
      data: {
        threats: threats.rows[0].c,
        alerts: alerts.rows[0].c,
        investigations: investigations.rows[0].c,
        visitorAlerts: visitorAlerts.rows[0].c,
      },
    });
  } catch (err) {
    console.error("❌ /stats/sidebar:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
