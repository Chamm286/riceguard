"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, TrendingUp, AlertTriangle, Cloud, Droplets, Thermometer, ArrowRight } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function FarmerDashboard() {
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ total: 0, severe: 0, healthy: 0 });

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUserName(JSON.parse(u).full_name || "Nông dân");

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reports = res.data.data || [];
        setStats({
          total: reports.length,
          severe: reports.filter((r: any) => r.ai_severity === "cao").length,
          healthy: reports.filter((r: any) => r.ai_disease === "không có" || r.ai_disease === "Khong co").length,
        });
      } catch { /* ignore */ }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-8">
        <div className="absolute top-0 right-0 h-64 w-64 gradient-primary rounded-full blur-3xl opacity-20" />
        <div className="relative">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">Xin chào</p>
          <h1 className="text-3xl font-bold mt-2">{userName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Hệ thống cảnh báo sớm dịch bệnh cây lúa — AI phân tích hình ảnh, phát hiện sớm sâu bệnh
          </p>
          <Link href="/farmer/upload"
            className="inline-flex items-center gap-2 mt-5 rounded-xl gradient-primary text-white px-5 py-2.5 text-sm font-semibold shadow-lg glow hover:opacity-90">
            <Leaf className="h-4 w-4" /> Gửi báo cáo mới <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Leaf} label="Tổng báo cáo" value={stats.total} color="primary" />
        <MetricCard icon={AlertTriangle} label="Bệnh nặng" value={stats.severe} color="danger" />
        <MetricCard icon={TrendingUp} label="Khỏe mạnh" value={stats.healthy} color="success" />
        <MetricCard icon={Cloud} label="Dự báo mưa" value="60%" color="cyber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WeatherCard icon={Thermometer} label="Nhiệt độ" value="32°C" sub="Cao hơn TB 2°C" color="danger" />
        <WeatherCard icon={Droplets} label="Độ ẩm" value="78%" sub="Thuận lợi cho nấm" color="warning" />
        <WeatherCard icon={Cloud} label="Mưa 24h" value="12mm" sub="Bình thường" color="cyber" />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
  const gradients: any = {
    primary: "gradient-primary", danger: "gradient-danger",
    success: "gradient-success", cyber: "gradient-cyber",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradients[color]} mb-3 shadow-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}

function WeatherCard({ icon: Icon, label, value, sub, color }: any) {
  const colors: any = { danger: "text-danger", warning: "text-warning", cyber: "text-cyber" };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`h-5 w-5 ${colors[color]}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
