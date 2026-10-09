"use client";
import { motion } from "framer-motion";
import { BookOpen, Play, Clock, CheckCircle, AlertTriangle, Zap, Target, ListChecks, ArrowRight } from "lucide-react";

const playbooks = [
  {
    id: 1,
    name: "Xử lý Brute Force",
    desc: "Quy trình phản ứng khi phát hiện tấn công brute force",
    category: "Security",
    severity: "high",
    steps: 5,
    avgTime: "2 phút",
    runs: 34,
    successRate: 97,
    color: "gradient-danger",
  },
  {
    id: 2,
    name: "Block DDoS Attack",
    desc: "Kích hoạt khi có tấn công DDoS vào API",
    category: "Security",
    severity: "critical",
    steps: 7,
    avgTime: "5 phút",
    runs: 12,
    successRate: 100,
    color: "gradient-danger",
  },
  {
    id: 3,
    name: "Data Tampering Response",
    desc: "Khôi phục khi phát hiện dữ liệu NDVI bị sửa",
    category: "Data",
    severity: "high",
    steps: 6,
    avgTime: "10 phút",
    runs: 8,
    successRate: 100,
    color: "gradient-warning",
  },
  {
    id: 4,
    name: "Yellow Leaf Alert",
    desc: "Xử lý khi AI dự đoán vàng lá lúa",
    category: "Agriculture",
    severity: "medium",
    steps: 4,
    avgTime: "15 phút",
    runs: 56,
    successRate: 95,
    color: "gradient-primary",
  },
  {
    id: 5,
    name: "Ransomware Recovery",
    desc: "Khôi phục hệ thống sau khi bị ransomware",
    category: "Security",
    severity: "critical",
    steps: 8,
    avgTime: "30 phút",
    runs: 3,
    successRate: 100,
    color: "gradient-danger",
  },
  {
    id: 6,
    name: "SSL Cert Renewal",
    desc: "Gia hạn chứng chỉ SSL sắp hết hạn",
    category: "Maintenance",
    severity: "low",
    steps: 3,
    avgTime: "5 phút",
    runs: 45,
    successRate: 100,
    color: "gradient-success",
  },
];

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

export default function PlaybooksPage() {
  const totalRuns = playbooks.reduce((s, p) => s + p.runs, 0);
  const avgSuccess = Math.round(playbooks.reduce((s, p) => s + p.successRate, 0) / playbooks.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Playbooks", value: playbooks.length, icon: BookOpen, color: "gradient-primary" },
          { label: "Tổng lần chạy", value: totalRuns, icon: Zap, color: "gradient-cyber" },
          { label: "Tỷ lệ thành công", value: `${avgSuccess}%`, icon: CheckCircle, color: "gradient-success" },
          { label: "Critical", value: playbooks.filter((p) => p.severity === "critical").length, icon: AlertTriangle, color: "gradient-danger" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playbooks.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="hover-lift rounded-2xl border border-border bg-card p-5 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${p.color} glow group-hover:scale-110 transition`}>
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[p.severity]}`}>
                {p.severity}
              </span>
            </div>

            <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.desc}</p>

            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />Steps</p>
                <p className="font-semibold mt-0.5">{p.steps}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Time</p>
                <p className="font-semibold mt-0.5">{p.avgTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Success</p>
                <p className={`font-semibold mt-0.5 ${p.successRate === 100 ? "text-success" : "text-warning"}`}>{p.successRate}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Chạy {p.runs} lần
              </span>
              <button className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-[10px] font-semibold text-white glow hover:opacity-90 transition">
                <Play className="h-3 w-3" />
                Chạy
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
