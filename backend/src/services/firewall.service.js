const { exec } = require('child_process');
const net = require('net');
const pool = require('../config/database');

function runIptables(args, command = 'iptables') {
  return new Promise((resolve) => {
    exec(`sudo -n ${command} ${args}`, (error, stdout, stderr) => {
      resolve({ ok: !error, error: error?.message || stderr || null });
    });
  });
}

async function listBlocked() {
  const { rows } = await pool.query(
    `SELECT id, ip AS ip_address, reason, created_at AS blocked_at FROM blocked_ips ORDER BY created_at DESC`
  );
  return rows;
}

async function blockIP(ip, reason) {
  if (net.isIP(ip) === 0) {
    const error = new Error('IP không hợp lệ');
    error.code = 'INVALID_IP';
    throw error;
  }

  if (['127.0.0.1', '::1', '0.0.0.0', 'localhost'].includes(ip)) {
    return { ip, skipped: true, reason: reason || 'Manual block', iptables: 'skipped' };
  }

  const command = net.isIP(ip) === 6 ? 'ip6tables' : 'iptables';
  const check = await runIptables(`-C INPUT -s ${ip} -j DROP`, command);
  if (!check.ok) {
    await runIptables(`-A INPUT -s ${ip} -j DROP`, command);
  }

  const { rows } = await pool.query(
    `INSERT INTO blocked_ips (ip, reason, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (ip) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()
     RETURNING id, ip AS ip_address, reason, created_at AS blocked_at`,
    [ip, reason || 'Manual block']
  );

  return {
    ...rows[0],
    iptables: check.ok ? 'already_exists' : 'applied',
    skipped: false,
  };
}

async function unblockIP(ip) {
  if (net.isIP(ip) === 0) {
    const error = new Error('IP không hợp lệ');
    error.code = 'INVALID_IP';
    throw error;
  }

  const command = net.isIP(ip) === 6 ? 'ip6tables' : 'iptables';
  for (let i = 0; i < 5; i++) {
    const result = await runIptables(`-D INPUT -s ${ip} -j DROP`, command);
    if (!result.ok) break;
  }

  await pool.query('DELETE FROM blocked_ips WHERE ip = $1', [ip]);
  return listBlocked();
}

module.exports = { blockIP, unblockIP, listBlocked };
