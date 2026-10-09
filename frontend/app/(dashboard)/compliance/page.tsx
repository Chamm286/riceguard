"use client";
import { motion } from "framer-motion";
import { CheckSquare, CheckCircle, XCircle, AlertTriangle, Shield, Lock, FileText, Database, Users, Globe } from "lucide-react";

const frameworks = [
  { id: 1, name: "ISO 27001", desc: "Tiêu chuẩn quản lý an toàn thông tin", progress: 78, total: 114, passed: 89, color: "gradient-primary", icon: Shield },
  { id: 2, name: "GDPR", desc: "Bảo vệ dữ liệu cá nhân EU", progress: 92, total: 50, passed: 46, color: "gradient-cyber", icon: Lock },
  { id: 3, name: "SOC 2", desc: "Kiểm soát dịch vụ", progress: 65, total: 64, passed: 42, color: "gradient-warning", icon: FileText },
  { id: 4, name: "NIST", desc: "Khung bảo mật NIST", progress: 84, total: 108, passed: 91, color: "gradient-success", icon: Database },
];

const checklist = [
  { category: "Access Control", items: [
    { name: "MFA bắt buộc cho admin", status: "passed" },
    { name: "Password policy mạnh", status: "passed" },
    { name: "Role-based access control", status: "passed" },
    { name: "Session timeout 30p", status: "warning" },
    { name: "Audit log mọi truy cập", status: "passed" },
  ]},
  { category: "Data Protection", items: [
    { name: "Mã hóa AES-256", status: "passed" },
    { name: "Backup hàng ngày", status: "passed" },
    { name: "Backup offsite", status: "failed" },
    { name: "Data classification", status: "passed" },
  ]},
  { category: "Network Security", items: [
    { name: "Firewall rules", status: "passed" },
    { name: "IDS/IPS", status: "passed" },
    { name: "VPN cho remote access", status: "passed" },
    { name: "Network segmentation", status: "warning" },
  ]},
];

const statusIcon: Record<string, any> = {
  passed: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  failed: { icon: XCircle, color: "text-danger", bg: "bg-danger/10" },
};

export default function CompliancePage() {
  const totalPassed = frameworks.reduce((s, f) => s + f.passed, 0);
  const totalItems = frameworks.reduce((s, f) => s + f.total, 0);
  const overallProgress = Math.round((totalPassed / totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Tiến độ tuân thủ tổng thể</h3>
              <p className="text-xs text-muted-foreground">{totalPassed} / {totalItems} yêu cầu đã đáp ứng</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gradient">{overallProgress}%</p>
            <p className="text-xs text-muted-foreground">Hoàn thành</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-accent overflow-hidden">
          <div className="h-full gradient-primary transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
      </motion.div>

      {/* Frameworks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-5 hover-lift">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.color} mb-4`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold">{f.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{f.desc}</p>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">{f.passed} / {f.total}</span>
                <span className="font-semibold text-primary">{f.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                <div className={`h-full ${f.color} transition-all`} style={{ width: `${f.progress}%` }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {checklist.map((cat, i) => (
          <motion.div key={cat.category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-4">{cat.category}</h3>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const s = statusIcon[item.status];
                const Icon = s.icon;
                return (
                  <div key={item.name} className="flex items-center gap-3 rounded-xl bg-accent/40 p-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                    </div>
                    <span className="text-xs flex-1">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
