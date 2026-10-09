"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Leaf, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Report {
  id: number;
  title: string;
  description: string;
  image_url: string;
  ai_analysis: string;
  ai_severity: string;
  ai_disease: string;
  status: string;
  created_at: string;
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(res.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    reviewing: reports.filter(r => r.status === "reviewing").length,
    severe: reports.filter(r => r.ai_severity === "cao").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo của tôi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lịch sử báo cáo sức khỏe lúa đã gửi
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Tổng báo cáo" value={stats.total} color="primary" />
        <StatCard icon={Clock} label="Đang chờ AI" value={stats.pending} color="warning" />
        <StatCard icon={Loader2} label="Đang xử lý" value={stats.reviewing} color="cyber" />
        <StatCard icon={AlertTriangle} label="Bệnh nặng" value={stats.severe} color="danger" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mx-auto">
            <Leaf className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold mt-4">Chưa có báo cáo nào</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Bắt đầu gửi báo cáo đầu tiên</p>
          <Link href="/farmer/upload"
            className="inline-flex items-center gap-2 rounded-xl gradient-primary text-white px-5 py-2.5 text-sm font-semibold shadow-lg glow">
            <Leaf className="h-4 w-4" /> Tạo báo cáo mới
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition group">
              <div className="relative aspect-video bg-accent overflow-hidden">
                <img src={`${API_URL}${r.image_url}`} alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute top-2 left-2">
                  <StatusBadge status={r.status} />
                </div>
                {r.ai_severity && (
                  <div className="absolute top-2 right-2">
                    <SeverityBadge level={r.ai_severity} />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-1">{r.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                {r.ai_disease && (
                  <p className="text-xs"><span className="text-muted-foreground">Bệnh:</span> <span className="font-semibold">{r.ai_disease}</span></p>
                )}
                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  {new Date(r.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const gradients: any = {
    primary: "gradient-primary", warning: "gradient-warning",
    cyber: "gradient-cyber", danger: "gradient-danger",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradients[color] || gradients.primary} mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: { label: "Chờ AI", icon: Clock, cls: "bg-warning/90 text-white" },
    reviewing: { label: "Đang xử lý", icon: Loader2, cls: "bg-primary/90 text-white" },
    resolved: { label: "Hoàn tất", icon: CheckCircle2, cls: "bg-success/90 text-white" },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold backdrop-blur ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const map: any = {
    "cao": "bg-danger text-white",
    "trung bình": "bg-warning text-white",
    "thấp": "bg-success text-white",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${map[level] || "bg-muted text-foreground"}`}>
      {level}
    </span>
  );
}
