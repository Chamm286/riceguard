const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/mine', verifyToken, notificationController.getMine);
router.get('/count', verifyToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true, count: result.rows[0].count });
  } catch (err) {
    // Nếu bảng chưa có cột is_read hoặc không có bảng → trả về 0
    res.json({ success: true, count: 0 });
  }
});

router.put('/:id/read', verifyToken, notificationController.markRead);
router.put('/read-all', verifyToken, notificationController.markAllRead);

module.exports = router;
