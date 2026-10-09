const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// /count - cho mọi user đã login
router.get('/count', verifyToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM alerts`);
    res.json({ success: true, count: result.rows[0].count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

// Các route khác chỉ admin/analyst
router.post('/', verifyToken, requireRole('admin', 'analyst'), alertController.create);
router.get('/', verifyToken, requireRole('admin', 'analyst'), alertController.getAll);
router.get('/:id', verifyToken, requireRole('admin', 'analyst'), alertController.getById);
router.put('/:id/status', verifyToken, requireRole('admin', 'analyst'), alertController.updateStatus);

module.exports = router;
