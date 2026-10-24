const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name, role, telegram_chat_id, is_active, last_login, created_at
       FROM users ORDER BY id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_active phải là boolean' });
    }
    if (Number(id) === req.user.id && !is_active) {
      return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản đang đăng nhập' });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, username, email, full_name, role, is_active, last_login, created_at`,
      [is_active, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.json({
      success: true,
      data: result.rows[0],
      message: is_active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản',
    });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
