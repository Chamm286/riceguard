"use client";
import { motion } from "framer-motion";
import { Search, Fingerprint, Clock, CheckCircle } from "lucide-react";

const investigations = [
  { id: "INV-2026-001", title: "Brute force từ IP 203.113.45.67", status: "investigating", severity: "high", started: "10 phút trước", analyst: "Tống Mỹ Trà", target: "API Gateway" },
  { id: "INV-2026-002", title: "DDoS vào API Sentinel", status: "investigating", severity: "critical", started: "30 phút trước", analyst: "Trần Anh Tuấn", target: "Sensor API" },
  { id: "INV-2026-003", title: "Data tampering vùng A1", status: "resolved", severity: "high", started: "1 giờ trước", analyst: "Nguyễn Hữu Thuận", target: "Database" },
  { id: "INV-2026-004", title: "Phishing email giả admin", status: "resolved", severity: "medium", started: "1 ngày trước", analyst: "Nguyễn Thị Bích Trâm", target: "Email Server" },
  { id: "INV-2026-005", title: "Ransomware trên server B", status: "resolved", severity: "critical", started: "3 ngày trước", analyst: "Cả nhóm", target: "File Server" },
  { id: "INV-2026-006", title: "SQL Injection attempt", status: "resolved", severity: "high", started: "4 ngày trước", analyst: "Trần Anh Tuấn", target: "Web App" },
  { id: "INV-2026-007", title: "Unauthorized SSH access", status: "investigating", severity: "medium", started: "5 ngày trước", analyst: "Tống Mỹ Trà", target: "Linux Server" },
];

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

export default function InvestigationsPage() {
  const stats = {
    total: investigations.length,
    investigating: investigations.filter((i) => i.status === "investigating").length,
    resolved: investigations.filter((i) => i.status === "resolved").length,
    critical: investigations.filter((i) => i.severity === "critical").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-gradient">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng điều tra</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-warning">{stats.investigating}</p>
          <p className="text-xs text-muted-foreground mt-1">Đang điều tra</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-success">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground mt-1">Đã xử lý</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-danger">{stats.critical}</p>
          <p className="text-xs text-muted-foreground mt-1">Critical</p>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-64 flex items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Tìm kiếm điều tra..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none">
          <option>Tất cả trạng thái</option>
          <option>Đang điều tra</option>
          <option>Đã xử lý</option>
        </select>
      </div>

      <div className="space-y-3">
        {investigations.map((inv, i) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="hover-lift rounded-2xl border border-border bg-card p-5 flex items-center gap-4"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${inv.status === "investigating" ? "gradient-warning" : "gradient-primary"}`}>
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityColor[inv.severity]}`}>
                  {inv.severity}
                </span>
              </div>
              <p className="font-medium truncate">{inv.title}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{inv.started}</span>
                <span>👤 {inv.analyst}</span>
                <span>🎯 {inv.target}</span>
              </div>
            </div>
            {inv.status === "resolved" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1 text-xs font-medium text-success whitespace-nowrap">
                <CheckCircle className="h-3 w-3" />
                Đã xử lý
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/30 px-3 py-1 text-xs font-medium text-warning whitespace-nowrap">
                <Search className="h-3 w-3" />
                Đang điều tra
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
