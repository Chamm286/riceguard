const PATTERNS = [
  {
    type: 'sql_injection',
    category: 'sql_injection',
    severity: 'critical',
    title: 'SQL Injection',
    regex: /(\bunion\b[\s\S]{0,40}\bselect\b|\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|'\s*or\s+'?\d|information_schema|\bxp_cmdshell\b|\bwaitfor\s+delay\b|\bbenchmark\s*\(|\bsleep\s*\(\s*\d|;\s*drop\s+table|'\s*--)/i,
  },
  {
    type: 'xss',
    category: 'xss',
    severity: 'critical',
    title: 'Cross-Site Scripting (XSS)',
    regex: /(<\s*script\b|%3c\s*script|javascript\s*:|on(error|load|click|mouseover)\s*=|<\s*iframe\b|%3c\s*iframe|document\.cookie|<\s*img[^>]+onerror)/i,
  },
  {
    type: 'path_traversal',
    category: 'path_traversal',
    severity: 'critical',
    title: 'Path Traversal',
    regex: /((\.\.\/){2,}|\.\.%2f|%2e%2e(%2f|\/)|%2fetc%2fpasswd|\/etc\/(passwd|shadow)|\/proc\/self|\.\.\\)/i,
  },
  {
    type: 'command_injection',
    category: 'command_injection',
    severity: 'critical',
    title: 'Command Injection',
    regex: /([;|`]\s*(cat|ls|whoami|id|uname|curl|wget|nc|bash|sh)\b|\$\(\s*(cat|ls|whoami|id|uname|curl|wget)\b)/i,
  },
  {
    type: 'scanner',
    category: 'scanner',
    severity: 'high',
    title: 'Automated Scanner',
    regex: /(sqlmap|nikto|nmap|masscan|acunetix|nessus|dirbuster|gobuster|wfuzz|zgrab|nuclei)/i,
  },
];

const SAFE_PATHS = new Set(['/api/health', '/api/visitors/track']);

function decodeValue(value) {
  if (typeof value !== 'string' || !value) return '';
  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch (err) {
      break;
    }
  }
  return decoded;
}

function collectRequestText(req) {
  const parts = [req.originalUrl || req.url || '', req.headers['user-agent'] || ''];

  if (req.query && Object.keys(req.query).length) {
    parts.push(JSON.stringify(req.query));
  }

  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    try {
      parts.push(JSON.stringify(req.body));
    } catch (err) {
      // Ignore body that cannot be serialized.
    }
  }

  return parts.filter(Boolean).join('\n');
}

function detectAttack(req) {
  if (SAFE_PATHS.has((req.path || '').toLowerCase())) return null;

  const raw = collectRequestText(req);
  if (!raw) return null;
  const text = decodeValue(raw);

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(text)) {
      return {
        type: pattern.type,
        category: pattern.category,
        severity: pattern.severity,
        title: pattern.title,
      };
    }
  }

  return null;
}

module.exports = { detectAttack };
