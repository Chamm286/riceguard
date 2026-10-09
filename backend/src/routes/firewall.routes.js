const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// File lưu danh sách IP bị block
const BLOCKED_FILE = path.join(__dirname, '../../data/blocked_ips.json');

// Đảm bảo thư mục data tồn tại
const dataDir = path.dirname(BLOCKED_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Hàm đọc danh sách IP bị block
function getBlockedIPs() {
  try {
    if (!fs.existsSync(BLOCKED_FILE)) return [];
    return JSON.parse(fs.readFileSync(BLOCKED_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

// Hàm lưu danh sách
function saveBlockedIPs(ips) {
  fs.writeFileSync(BLOCKED_FILE, JSON.stringify(ips, null, 2));
}

// POST /api/firewall/block
router.post('/block', async (req, res) => {
  const { ip, reason } = req.body;

  if (!ip) {
    return res.status(400).json({ success: false, message: 'Thiếu IP' });
  }

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return res.status(400).json({ success: false, message: 'IP không hợp lệ' });
  }

  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '0.0.0.0') {
    console.log(`⚠️  Bỏ qua IP localhost: ${ip}`);
    return res.json({ success: true, message: 'Bỏ qua localhost', ip, skipped: true });
  }

  // Block bằng iptables (không dùng sudo trong code, dùng sudoers NOPASSWD)
  exec(`sudo -n iptables -A INPUT -s ${ip} -j DROP`, (error, stdout, stderr) => {
    if (error) {
      console.error('Lỗi iptables:', error.message);
      // Vẫn lưu vào file dù iptables fail
      const blocked = getBlockedIPs();
      if (!blocked.find(b => b.ip === ip)) {
        blocked.push({ ip, reason, blocked_at: new Date().toISOString(), iptables_error: error.message });
        saveBlockedIPs(blocked);
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi block IP (iptables)', 
        error: error.message,
        ip,
      });
    }

    // Lưu vào file
    const blocked = getBlockedIPs();
    if (!blocked.find(b => b.ip === ip)) {
      blocked.push({ ip, reason, blocked_at: new Date().toISOString() });
      saveBlockedIPs(blocked);
    }

    console.log(`✅ Blocked IP: ${ip} - Reason: ${reason}`);
    res.json({ 
      success: true, 
      message: `Đã block IP ${ip}`,
      ip, 
      reason,
      total_blocked: blocked.length,
    });
  });
});

// GET /api/firewall/blocked
router.get('/blocked', (req, res) => {
  const blocked = getBlockedIPs();
  res.json({ success: true, total: blocked.length, ips: blocked });
});

// DELETE /api/firewall/unblock/:ip
router.delete('/unblock/:ip', (req, res) => {
  const { ip } = req.params;
  
  exec(`sudo -n iptables -D INPUT -s ${ip} -j DROP`, (error) => {
    // Xóa khỏi file dù iptables có lỗi hay không
    const blocked = getBlockedIPs().filter(b => b.ip !== ip);
    saveBlockedIPs(blocked);
    
    if (error) {
      return res.json({ 
        success: true, 
        message: `Đã xóa ${ip} khỏi danh sách (iptables có thể không có rule)`,
        ip,
        total_blocked: blocked.length,
      });
    }
    
    res.json({ success: true, message: `Đã unblock IP ${ip}`, ip, total_blocked: blocked.length });
  });
});

module.exports = router;
