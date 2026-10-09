const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { verifyToken } = require("../middlewares/auth.middleware");

// GET /api/plots - Danh sách thửa
router.get("/", verifyToken, async (req, res) => {
  try {
    const isAdmin = ["admin", "analyst"].includes(req.user.role);
    let query, params;

    if (isAdmin) {
      query = `SELECT p.*, f.name AS field_name, f.location, f.owner_id
               FROM plots p
               LEFT JOIN fields f ON f.id = p.field_id
               ORDER BY p.field_id, p.id`;
      params = [];
    } else {
      query = `SELECT p.*, f.name AS field_name, f.location
               FROM plots p
               LEFT JOIN fields f ON f.id = p.field_id
               WHERE f.owner_id = $1
               ORDER BY p.field_id, p.id`;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ GET /plots:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
