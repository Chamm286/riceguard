"use client";
import { motion } from "framer-motion";
import { Search, Fingerprint, Clock, CheckCircle } from "lucide-react";

const investigations = [
  { id: "INV-001", title: "Brute force từ IP 203.113.45.67", status: "Đang điều tra", severity: "high", started: "10 phút trước", analyst: "Tống Mỹ Trà" },
  { id: "INV-002", title: "DDoS vào API Sentinel", status: "Đang điều tra", severity: "critical", started: "30 phút trước", analyst: "Trần Anh Tuấn" },
  { id: "INV-003", title: "Data tampering vùng A1", status: "Đã xử lý", severity: "high", started: "1 giờ trước", analyst: "Nguyễn Hữu Thuận" },
  { id: "INV-004", title: "Phishing email giả admin", status: "Đã xử lý", severity: "medium", started: "1 ngày trước", analyst: "Nguyễn Thị Bích Trâm" },
  { id: "INV-005", title: "Ransomware trên server B", status: "Đã xử lý", severity: "critical", started: "3 ngày trước", analyst: "Cả nhóm" },
];

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

export default function InvestigationsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-gradient">5</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng điều tra</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-warning">2</p>
          <p className="text-xs text-muted-foreground mt-1">Đang điều tra</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-success">3</p>
          <p className="text-xs text-muted-foreground mt-1">Đã xử lý</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-3xl font-bold text-danger">2</p>
          <p className="text-xs text-muted-foreground mt-1">Critical</p>
        </div>
      </div>

      <div className="space-y-3">
        {investigations.map((inv, i) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="hover-lift rounded-2xl border border-border bg-card p-5 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-cyber shrink-0">
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityColor[inv.severity]}`}>
                  {inv.severity}
                </span>
              </div>
              <p className="font-medium">{inv.title}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{inv.started}</span>
                <span>👤 {inv.analyst}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {inv.status === "Đã xử lý" ? (
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle className="h-3 w-3" />
                  Đã xử lý
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/30 px-3 py-1 text-xs font-medium text-warning">
                  <Search className="h-3 w-3" />
                  Đang điều tra
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
