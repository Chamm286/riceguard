const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon, severity, symptoms, cause, treatment, prevention
       FROM disease_library ORDER BY id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Disease library error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
