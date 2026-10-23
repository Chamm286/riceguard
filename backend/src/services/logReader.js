const fs = require("fs");
const readline = require("readline");
const pool = require("../config/database");

const LOG_DIR = process.env.LOG_DIR || require("path").join(require("os").homedir(), "riceguard", "logs");
const N8N_BASE = "http://localhost:5678/webhook";

let currentFile = null;
let lastPosition = 0;

function findLogFile() {
  if (!fs.existsSync(LOG_DIR)) return null;
  const files = fs.readdirSync(LOG_DIR).filter((f) => f.startsWith("logs.ndjson"));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const sa = fs.statSync(`${LOG_DIR}/${a}`).mtimeMs;
    const sb = fs.statSync(`${LOG_DIR}/${b}`).mtimeMs;
    return sb - sa;
  });
  return `${LOG_DIR}/${files[0]}`;
}

async function readNewLogs() {
  const file = findLogFile();
  if (!file) return;

  if (file !== currentFile) {
    console.log("📂 Chuyển file:", file);
    currentFile = file;
    try {
      const s = fs.statSync(file);
      lastPosition = s.size;
    } catch (e) {
      lastPosition = 0;
    }
    return;
  }

  let stats;
  try {
    stats = fs.statSync(file);
  } catch (e) {
    return;
  }

  if (stats.size < lastPosition) lastPosition = 0;
  if (stats.size === lastPosition) return;

  const stream = fs.createReadStream(file, {
    start: lastPosition,
    encoding: "utf8",
  });

  const rl = readline.createInterface({ input: stream });
  const newLogs = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      newLogs.push(JSON.parse(line));
    } catch (e) {}
  }

  lastPosition = stats.size;

  if (newLogs.length > 0) {
    console.log(`📥 Đọc ${newLogs.length} log lúc ${new Date().toLocaleTimeString("vi-VN")}`);
  }

  for (const log of newLogs) {
    await processLog(log);
  }
}

async function processLog(log) {
  try {
    const source = log.source_type || "unknown";
    if (source === "postgres") return;

    const analysis = analyzeLog(log);

    // Lưu log vào DB
    await pool.query(
      `INSERT INTO logs (source, event_type, severity, ip_address, message, raw_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        source,
        analysis.event_type,
        analysis.severity,
        analysis.ip_address,
        analysis.message,
        JSON.stringify(log),
      ]
    );

    // Emit realtime log cho FE
    if (global.io) {
      global.io.to('alerts').emit('new_log', {
        message: analysis.message,
        severity: analysis.severity,
        ip_address: analysis.ip_address,
        created_at: new Date().toISOString(),
      });
    }

    // Nếu là alert nguy hiểm
    if (analysis.severity === "critical" || analysis.severity === "high") {
      const recent = await pool.query(
        `SELECT id FROM alerts
         WHERE title = $1 AND COALESCE(ip_address, 'unknown') = COALESCE($2, 'unknown')
           AND created_at > NOW() - INTERVAL '5 minutes'`,
        [analysis.title, analysis.ip_address]
      );

      if (recent.rows.length === 0) {
        const inserted = await pool.query(
          `INSERT INTO alerts (alert_type, category, severity, title, description, ip_address, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())
           RETURNING id, title, severity, description, created_at`,
          [
            analysis.category,
            'security',
            analysis.severity,
            analysis.title,
            analysis.message,
            analysis.ip_address,
          ]
        );

        const alert = inserted.rows[0];
        console.log(`🚨 ALERT #${alert.id}: ${analysis.title}`);

        // Gửi n8n webhook (luồng gộp security-event)
        const url = `${N8N_BASE}/security-event`;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ip: analysis.ip_address || "unknown",
              path: log.originalUrl || log.path || log.request_uri || "",
              query: log.query || "",
              payload: analysis.message || "",
              user_agent: log.http_user_agent || log.user_agent || "",
              event: analysis.category === "brute_force" ? "ssh_failed" : (analysis.category === "port_scan" ? "port_scan" : undefined),
              failed_count: analysis.category === "brute_force" ? 5 : undefined,
              ports_count: analysis.category === "port_scan" ? 10 : undefined,
              alert_id: alert.id,
              category: analysis.category,
              title: alert.title,
              severity: alert.severity,
              message: alert.description,
              created_at: alert.created_at,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (res.ok) {
            console.log(`📤 Alert #${alert.id} → n8n (${webhookPath})`);
          } else {
            console.log(`⚠️ n8n lỗi ${res.status} (${webhookPath})`);
          }
        } catch (e) {
          console.log(`⚠️ n8n không kết nối: ${e.message}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  }
}

function getWebhookPath(category) {
  const map = {
    brute_force: "detect-ssh",
    sql_injection: "detect-sql-injection",
    xss: "detect-xss",
    path_traversal: "detect-traversal",
    command_injection: "detect-command",
    port_scan: "detect-portscan",
    invalid_user: "detect-ssh",
    suspicious_login: "detect-ssh",
  };
  return map[category] || "detect-ssh";
}

function extractIP(log, msg) {
  if (log.http_x_forwarded_for) {
    const first = log.http_x_forwarded_for.split(",")[0].trim();
    if (first && first !== "-") return first;
  }
  if (log.cf_connecting_ip) return log.cf_connecting_ip;
  if (log.http_x_real_ip) return log.http_x_real_ip;

  // IPv6 localhost
  if (msg.includes("::1")) return "::1";

  // IPv4
  const ipMatch = msg.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (ipMatch) return ipMatch[1];

  return null;
}

function analyzeLog(log) {
  const msg = (log.message || "").toLowerCase();
  const originalMsg = log.message || "";
  const ip = extractIP(log, originalMsg);

  // ========== SQL INJECTION ==========
  const hasUnionSelect = msg.includes("union") && msg.includes("select");
  const hasSqliUnion = msg.includes("%20union%20");
  const hasOrUnion = msg.includes("or%20union") || msg.includes("or union");
  const hasOr1Equal1 =
    msg.includes("or 1=1") || msg.includes("or%201=1") ||
    msg.includes("or 1 = 1") || msg.includes("or%201%20=%201") ||
    msg.includes("' or '1'='1") || msg.includes("%27%20or%20%271%27=%271") ||
    msg.includes("%27%20or%20") || msg.includes("' or ") || msg.includes("%27%20or");
  const hasDropTable = msg.includes("drop table") || msg.includes("drop%20table");
  const hasSqlComment = msg.includes("'--") || msg.includes("%27--") || msg.includes("' --");
  const hasInfoSchema = msg.includes("information_schema");
  const hasSleep = msg.includes("sleep(") || msg.includes("sleep%28");
  const hasBenchmark = msg.includes("benchmark(") || msg.includes("benchmark%28");

  if (hasUnionSelect || hasOr1Equal1 || hasDropTable || hasSqlComment ||
      hasInfoSchema || hasSleep || hasBenchmark || hasSqliUnion || hasOrUnion) {
    return {
      event_type: "sql_injection",
      severity: "critical",
      category: "sql_injection",
      ip_address: ip,
      message: originalMsg,
      title: `SQL Injection từ ${ip || "unknown"}`,
    };
  }

  // ========== XSS ==========
  if (msg.includes("<script") || msg.includes("%3cscript") ||
      msg.includes("javascript:") || msg.includes("onerror=") ||
      msg.includes("onload=") || msg.includes("<iframe") ||
      msg.includes("%3ciframe") || msg.includes("alert(") ||
      msg.includes("document.cookie") || msg.includes("%3cimg")) {
    return {
      event_type: "xss_attack",
      severity: "critical",
      category: "xss",
      ip_address: ip,
      message: originalMsg,
      title: `XSS Attack từ ${ip || "unknown"}`,
    };
  }

  // ========== PATH TRAVERSAL ==========
  if (msg.includes("../") || msg.includes("..%2f") || msg.includes("%2e%2e") ||
      msg.includes("/etc/passwd") || msg.includes("%2fetc%2fpasswd") ||
      msg.includes("/proc/self") || msg.includes("..\\") || msg.includes("etc/shadow")) {
    return {
      event_type: "path_traversal",
      severity: "critical",
      category: "path_traversal",
      ip_address: ip,
      message: originalMsg,
      title: `Path Traversal từ ${ip || "unknown"}`,
    };
  }

  // ========== COMMAND INJECTION ==========
  if ((msg.includes(";") || msg.includes("|") || msg.includes("`")) &&
      (msg.includes("cat ") || msg.includes("ls ") || msg.includes("whoami") ||
       msg.includes("id ") || msg.includes("uname"))) {
    return {
      event_type: "command_injection",
      severity: "critical",
      category: "command_injection",
      ip_address: ip,
      message: originalMsg,
      title: `Command Injection từ ${ip || "unknown"}`,
    };
  }

  // ========== PORT SCAN ==========
  if (msg.includes("port scan") || msg.includes("nmap") ||
      msg.includes("portscan") || msg.includes("syn scan")) {
    return {
      event_type: "port_scan",
      severity: "high",
      category: "port_scan",
      ip_address: ip,
      message: originalMsg,
      title: `Port Scan từ ${ip || "unknown"}`,
    };
  }

  // ========== SSH BRUTE FORCE ==========
  if (originalMsg.includes("Failed password")) {
    return {
      event_type: "login_failed",
      severity: "high",
      category: "brute_force",
      ip_address: ip,
      message: originalMsg,
      title: `Brute force SSH từ ${ip || "unknown"}`,
    };
  }

  // ========== INVALID USER ==========
  if (originalMsg.match(/Invalid user|invalid user/i)) {
    return {
      event_type: "invalid_user",
      severity: "medium",
      category: "invalid_user",
      ip_address: ip,
      message: originalMsg,
      title: `Truy cập user không tồn tại từ ${ip || "unknown"}`,
    };
  }

  // ========== LOGIN SUCCESS ==========
  if (originalMsg.includes("Accepted password") || originalMsg.includes("Accepted publickey")) {
    return {
      event_type: "login_success",
      severity: "info",
      category: "login",
      ip_address: ip,
      message: originalMsg,
      title: "Đăng nhập SSH thành công",
    };
  }

  // ========== NGINX 4xx ==========
  if (originalMsg.match(/" 4\d\d /)) {
    return {
      event_type: "http_client_error",
      severity: "warning",
      category: "web",
      ip_address: ip,
      message: originalMsg,
      title: "Lỗi HTTP client (4xx)",
    };
  }

  // ========== NGINX 5xx ==========
  if (originalMsg.match(/" 5\d\d /)) {
    return {
      event_type: "http_server_error",
      severity: "high",
      category: "web",
      ip_address: ip,
      message: originalMsg,
      title: "Lỗi HTTP server (5xx)",
    };
  }

  // ========== DEFAULT ==========
  return {
    event_type: "generic",
    severity: "info",
    category: "system",
    ip_address: ip,
    message: originalMsg,
    title: "Log hệ thống",
  };
}

function startLogReader() {
  console.log("🔍 Đọc log từ Filebeat...");
  console.log("📂 File:", findLogFile() || "CHƯA CÓ");
  console.log("🔗 n8n Base:", N8N_BASE);
  console.log("📌 Routes:");
  console.log("   - brute_force       → detect-ssh");
  console.log("   - sql_injection     → detect-sql-injection");
  console.log("   - xss               → detect-xss");
  console.log("   - path_traversal    → detect-traversal");
  console.log("   - command_injection → detect-command");
  console.log("   - port_scan         → detect-portscan");
  setInterval(readNewLogs, 1000);
}

module.exports = { startLogReader, readNewLogs };
