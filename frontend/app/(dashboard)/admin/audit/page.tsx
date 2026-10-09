"use client";
import { motion } from "framer-motion";
import { ScrollText, User, Shield, Database, AlertTriangle } from "lucide-react";

const logs = [
  { id: 1, action: "USER_LOGIN", user: "farmer1", ip: "192.168.1.10", time: "2 phút trước", level: "info", icon: User },
  { id: 2, action: "REPORT_CREATED", user: "farmer1", ip: "192.168.1.10", time: "5 phút trước", level: "info", icon: Database },
  { id: 3, action: "FAILED_LOGIN", user: "unknown", ip: "45.123.45.67", time: "15 phút trước", level: "warning", icon: AlertTriangle },
  { id: 4, action: "AI_ANALYSIS_DONE", user: "system", ip: "-", time: "8 phút trước", level: "info", icon: Shield },
  { id: 5, action: "DB_BACKUP", user: "system", ip: "-", time: "1 giờ trước", level: "info", icon: Database },
  { id: 6, action: "BRUTE_FORCE_DETECTED", user: "unknown", ip: "45.123.45.67", time: "15 phút trước", level: "danger", icon: AlertTriangle },
];

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Nhật ký hoạt động toàn hệ thống</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {logs.map((l, i) => {
            const Icon = l.icon;
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 hover:bg-accent/30 transition"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                  l.level === "danger" ? "gradient-danger" :
                  l.level === "warning" ? "gradient-warning" : "gradient-primary"
                }`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{l.action}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>👤 {l.user}</span>
                    <span>🌐 {l.ip}</span>
                    <span>🕐 {l.time}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  l.level === "danger" ? "bg-danger/20 text-danger" :
                  l.level === "warning" ? "bg-warning/20 text-warning" :
                  "bg-primary/20 text-primary"
                }`}>{l.level}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
