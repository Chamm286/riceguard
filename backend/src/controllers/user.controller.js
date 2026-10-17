const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, last_login, created_at FROM users ORDER BY id'
    );
    
    // Thêm field is_active = true cho tất cả user (vì không có cột này trong DB)
    const users = result.rows.map(u => ({
      ...u,
      is_active: true
    }));
    
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
