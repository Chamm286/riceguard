const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// GET /api/audit - Audit log
router.get('/', verifyToken, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, source, event_type, severity, ip_address, message, created_at
      FROM logs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
