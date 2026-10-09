"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, TrendingUp, AlertTriangle, CheckCircle2, Search, Filter, Loader2 } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CyberFarmerReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(res.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const stats = {
    total: reports.length,
    severe: reports.filter(r => r.ai_severity === "cao").length,
    pending: reports.filter(r => r.status === "pending").length,
    healthy: reports.filter(r => !r.ai_disease || r.ai_disease === "không có").length,
  };

  const filtered = reports.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) ||
                        r.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.ai_severity === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo sức khỏe lúa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Giám sát toàn bộ báo cáo từ nông dân — phát hiện sớm dịch bệnh
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Leaf} label="Tổng báo cáo" value={stats.total} color="primary" />
        <StatCard icon={AlertTriangle} label="Bệnh nặng" value={stats.severe} color="danger" />
        <StatCard icon={Loader2} label="Đang chờ AI" value={stats.pending} color="warning" />
        <StatCard icon={CheckCircle2} label="Khỏe mạnh" value={stats.healthy} color="success" />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc tên nông dân..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">Tất cả mức độ</option>
          <option value="cao">Mức độ cao</option>
          <option value="trung bình">Trung bình</option>
          <option value="thấp">Thấp</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition group"
            >
              <div className="relative aspect-video bg-accent">
                {r.image_url && (
                  <img src={`${API_URL}${r.image_url}`} alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                )}
                {r.ai_severity && (
                  <span className={`absolute top-2 right-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${
                    r.ai_severity === "cao" ? "bg-danger text-white" :
                    r.ai_severity === "trung bình" ? "bg-warning text-white" : "bg-success text-white"
                  }`}>{r.ai_severity}</span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-1">{r.title}</h3>
                <p className="text-xs text-muted-foreground">👤 {r.user_name || "N/A"}</p>
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

      {filtered.length === 0 && !loading && (
        <div className="rounded-2xl border border-border bg-card p-16 text-center text-muted-foreground text-sm">
          Không có báo cáo nào
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const gradients: any = { primary: "gradient-primary", danger: "gradient-danger", warning: "gradient-warning", success: "gradient-success" };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradients[color]} mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}
