const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { verifyToken } = require("../middlewares/auth.middleware");

// GET /api/seasons
router.get("/", verifyToken, async (req, res) => {
  try {
    const isAdmin = ["admin", "analyst"].includes(req.user.role);
    let query, params;

    if (isAdmin) {
      query = `SELECT s.*, f.name AS field_name, f.location
               FROM seasons s
               LEFT JOIN fields f ON f.id = s.field_id
               ORDER BY s.start_date DESC`;
      params = [];
    } else {
      query = `SELECT s.*, f.name AS field_name, f.location
               FROM seasons s
               LEFT JOIN fields f ON f.id = s.field_id
               WHERE f.owner_id = $1
               ORDER BY s.start_date DESC`;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ GET /seasons:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
