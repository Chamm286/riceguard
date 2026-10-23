const pool = require('../config/database');

exports.getSecuritySettings = async (req, res) => {
  try {
    const r = await pool.query('SELECT auto_block_enabled, whitelist_ips FROM security_settings ORDER BY id LIMIT 1');
    res.json({ success: true, data: r.rows[0] || { auto_block_enabled: true, whitelist_ips: [] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.updateSecuritySettings = async (req, res) => {
  try {
    const { auto_block_enabled, whitelist_ips } = req.body;
    await pool.query(
      `UPDATE security_settings SET auto_block_enabled = COALESCE($1, auto_block_enabled),
        whitelist_ips = COALESCE($2, whitelist_ips), updated_at = NOW()
       WHERE id = (SELECT id FROM security_settings ORDER BY id LIMIT 1)`,
      [auto_block_enabled, whitelist_ips || null]
    );
    res.json({ success: true, message: 'Đã cập nhật cấu hình' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
