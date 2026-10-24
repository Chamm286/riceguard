const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const net = require('net');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const firewallService = require('../services/firewall.service');

const BLOCKED_FILE = path.join(__dirname, '../../data/blocked_ips.json');

function readLegacyFile() {
  try {
    if (!fs.existsSync(BLOCKED_FILE)) return [];
    return JSON.parse(fs.readFileSync(BLOCKED_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

router.get('/blocked', verifyToken, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const ips = await firewallService.listBlocked();
    res.json({ success: true, total: ips.length, ips, data: ips });
  } catch (err) {
    const legacy = readLegacyFile();
    res.json({ success: true, total: legacy.length, ips: legacy, data: legacy, legacy: true });
  }
});

router.post('/block', verifyToken, requireRole('admin', 'analyst'), async (req, res) => {
  const { ip, reason } = req.body;

  if (!ip) return res.status(400).json({ success: false, message: 'Thiếu IP' });
  if (net.isIP(ip) === 0) return res.status(400).json({ success: false, message: 'IP không hợp lệ' });

  try {
    const saved = await firewallService.blockIP(ip, reason);
    if (saved.skipped) {
      return res.json({ success: true, message: 'Bỏ qua IP localhost', ip, skipped: true });
    }
    const total = (await firewallService.listBlocked()).length;
    res.json({
      success: true,
      message: `Đã block IP ${ip}`,
      ip,
      reason: saved.reason,
      total_blocked: total,
      iptables: saved.iptables,
    });
  } catch (err) {
    console.error('Lỗi block IP:', err.message);
    res.status(500).json({ success: false, message: 'Không lưu được IP vào database', ip });
  }
});

router.delete('/unblock/:ip', verifyToken, requireRole('admin', 'analyst'), async (req, res) => {
  const { ip } = req.params;
  if (net.isIP(ip) === 0) return res.status(400).json({ success: false, message: 'IP không hợp lệ' });

  try {
    const ips = await firewallService.unblockIP(ip);
    res.json({ success: true, message: `Đã unblock IP ${ip}`, ip, total_blocked: ips.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Không xóa được IP khỏi database' });
  }
});

module.exports = router;
