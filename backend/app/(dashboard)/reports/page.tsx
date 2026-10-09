"use client";
import { motion } from "framer-motion";
import { FileBarChart, Download, Calendar, TrendingUp, ShieldAlert } from "lucide-react";

const reports = [
  { id: 1, name: "Báo cáo An ninh tuần 39/2026", date: "01/10/2026", type: "Weekly", size: "2.4 MB" },
  { id: 2, name: "Báo cáo Sự cố tháng 9/2026", date: "30/09/2026", type: "Monthly", size: "5.8 MB" },
  { id: 3, name: "Phân tích DDoS Q3/2026", date: "28/09/2026", type: "Quarterly", size: "8.1 MB" },
  { id: 4, name: "Tổng kết Vàng lá lúa", date: "25/09/2026", type: "Custom", size: "3.2 MB" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <FileBarChart className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold">Báo cáo đã tạo</p>
          </div>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-cyber">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold">Tăng trưởng</p>
          </div>
          <p className="text-3xl font-bold text-success">+18%</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-danger">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold">Sự cố critical</p>
          </div>
          <p className="text-3xl font-bold text-danger">7</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-5">
          <h3 className="font-semibold">Báo cáo gần đây</h3>
          <p className="text-xs text-muted-foreground">Tài liệu có thể tải xuống</p>
        </div>
        <div className="divide-y divide-border">
          {reports.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-5 hover:bg-accent/30 transition"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <FileBarChart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{r.date}</span>
                  <span className="rounded-full bg-accent px-2 py-0.5">{r.type}</span>
                  <span>{r.size}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium hover:bg-accent transition">
                <Download className="h-3.5 w-3.5" />
                Tải
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
