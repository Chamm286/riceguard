const net = require('net');

const LOOPBACK = new Set(['127.0.0.1', '::1']);

function stripAddress(value) {
  if (!value || typeof value !== 'string') return '';
  let ip = value.trim();
  if (ip.startsWith('[') && ip.includes(']')) ip = ip.slice(1, ip.indexOf(']'));
  if (ip.includes('%')) ip = ip.split('%')[0];
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip.startsWith('::FFFF:')) ip = ip.slice(7);
  return ip;
}

function normalizeIP(value) {
  const ip = stripAddress(value);
  if (!ip) return '';
  if (ip === 'localhost') return '127.0.0.1';
  return net.isIP(ip) ? ip : '';
}

function isPrivateIP(ip) {
  if (!ip) return false;
  if (LOOPBACK.has(ip)) return true;
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 169 && b === 254)
      || a === 0;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:');
  }
  return false;
}

function trustedProxyList() {
  return String(process.env.TRUSTED_PROXY_CIDRS || '127.0.0.1/8,::1/128')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ipv4ToInt(ip) {
  return ip.split('.').reduce((acc, part) => ((acc << 8) + Number(part)) >>> 0, 0);
}

function matchesCidr(ip, cidr) {
  if (!cidr) return false;
  if (!cidr.includes('/')) return ip === cidr;
  const [range, bitsRaw] = cidr.split('/');
  const bits = Number(bitsRaw);
  if (net.isIP(ip) === 4 && net.isIP(range) === 4) {
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
  }
  if (net.isIP(ip) === 6 && net.isIP(range) === 6) {
    return ip === range;
  }
  return false;
}

function isTrustedProxy(ip) {
  if (!ip) return false;
  return trustedProxyList().some((cidr) => matchesCidr(ip, cidr));
}

function firstForwarded(value) {
  if (!value || typeof value !== 'string') return '';
  return value.split(',')[0].trim();
}

function remoteAddress(req) {
  return normalizeIP(req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip);
}

function getClientIP(req) {
  const remote = remoteAddress(req);
  const trusted = isTrustedProxy(remote);

  if (trusted) {
    const candidates = [
      firstForwarded(req.headers['cf-connecting-ip']),
      firstForwarded(req.headers['x-real-ip']),
      firstForwarded(req.headers['x-forwarded-for']),
    ];
    for (const candidate of candidates) {
      const ip = normalizeIP(candidate);
      if (ip) return ip;
    }
  }

  if (remote) return remote;
  return normalizeIP(req.ip) || 'unknown';
}

module.exports = {
  getClientIP,
  normalizeIP,
  isPrivateIP,
  isTrustedProxy,
};
