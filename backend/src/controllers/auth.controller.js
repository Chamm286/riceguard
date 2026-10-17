const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Ghi log login fail + gọi webhook A1
const logLoginFailed = async (username, ip) => {
  try {
    const message = `Failed login attempt for username: ${username}`;
    
    // 1. Insert log vào DB
    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, message, created_at)
       VALUES ('auth', 'login_failed', 'warn', $1, $2, NOW())`,
      [ip || 'unknown', message]
    );
    console.log(`⚠️ Logged login failed: ${username} from ${ip}`);

    // 2. GỌI WEBHOOK A1
    try {
      const n8nRes = await fetch('http://localhost:5678/webhook/detect-ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'auth',
          event_type: 'login_failed',
          severity: 'warn',
          category: 'brute_force',
          ip_address: ip,
          message: message,
          ip: ip,
          user: username,
        }),
      });
      console.log(`✅ A1 webhook: ${n8nRes.status}`);
    } catch (e) {
      console.log(`⚠️ A1 webhook failed: ${e.message}`);
    }
  } catch (err) {
    console.error('❌ Log login failed error:', err.message);
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!username || !password) {
      await logLoginFailed(username || 'empty', clientIp);
      return res.status(400).json({ success: false, message: 'Thiếu username hoặc password' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      await logLoginFailed(username, clientIp);
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logLoginFailed(username, clientIp);
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // ✅ Log login thành công vào bảng logs
    try {
      await pool.query(
        `INSERT INTO logs (source, event_type, severity, ip_address, user_id, message, created_at)
         VALUES ('auth', 'USER_LOGIN', 'info', $1, $2, $3, NOW())`,
        [clientIp, user.id, `User ${user.username} đăng nhập thành công`]
      );
      console.log(`✅ Logged login success: ${user.username} from ${clientIp}`);
    } catch (e) {
      console.log(`⚠️ Log login failed: ${e.message}`);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy thông tin user hiện tại
exports.me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, telegram_chat_id FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
