"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Globe, ShieldAlert, TrendingUp, Activity, Zap, Eye, Ban,
  Search, RefreshCw, CheckCircle
} from "lucide-react";
import api from "@/lib/api";

interface Threat {
  id: number;
  ip_address: string;
  country: string;
  threat_type: string;
  severity: string;
  hits: number;
  status: string;
  last_seen: string;
  blocked_at: string | null;
}

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

export default function ThreatsPage() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("/threats", { params: { search, status: filter === "all" ? "" : filter } }),
      api.get("/threats/stats"),
    ])
      .then(([t, s]) => {
        setThreats(t.data.data);
        setStats(s.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, filter]);

  const handleBlock = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/threats/${id}/block`);
      fetchData();
    } catch (e) {
      window.alert("Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  const handleWatch = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/threats/${id}/watch`);
      fetchData();
    } catch (e) {
      window.alert("Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng mối đe dọa", value: stats?.total ?? 0, icon: AlertTriangle, color: "gradient-primary" },
          { label: "Đã block", value: stats?.blocked ?? 0, icon: Ban, color: "gradient-danger" },
          { label: "Đang theo dõi", value: stats?.watching ?? 0, icon: Eye, color: "gradient-warning" },
          { label: "Nguy hiểm", value: stats?.critical ?? 0, icon: Zap, color: "gradient-cyber" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
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

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 flex items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5 focus-within:border-primary/50 transition">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm IP hoặc loại tấn công..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50 transition"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="blocked">Đã block</option>
          <option value="watching">Đang theo dõi</option>
        </select>
        <button
          onClick={fetchData}
          className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-danger" />
              Mối đe dọa đang hoạt động
            </h3>
            <p className="text-xs text-muted-foreground">{threats.length} kết quả</p>
          </div>
          <span className="rounded-full bg-danger/10 border border-danger/30 px-3 py-1 text-[10px] font-semibold text-danger flex items-center gap-1.5">
            <Activity className="h-3 w-3 animate-pulse" />
            Live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">IP Address</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Quốc gia</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Loại tấn công</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Mức độ</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Số lần</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Lần cuối</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Trạng thái</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">Đang tải...</td></tr>
              ) : threats.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">Không có mối đe dọa</td></tr>
              ) : (
                threats.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-accent/30 transition"
                  >
                    <td className="px-5 py-4 font-mono text-xs">{t.ip_address}</td>
                    <td className="px-5 py-4 text-sm flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.country}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium capitalize">{t.threat_type.replace("_", " ")}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[t.severity]}`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm">{t.hits.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(t.last_seen).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-4">
                      {t.status === "blocked" ? (
                        <span className="flex items-center gap-1.5 w-fit rounded-full bg-danger/10 border border-danger/30 px-2.5 py-0.5 text-[10px] font-semibold text-danger">
                          <Ban className="h-3 w-3" />Blocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 w-fit rounded-full bg-warning/10 border border-warning/30 px-2.5 py-0.5 text-[10px] font-semibold text-warning">
                          <Eye className="h-3 w-3" />Watching
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {t.status !== "blocked" ? (
                          <button
                            onClick={() => handleBlock(t.id)}
                            disabled={actionLoading === t.id}
                            className="flex items-center gap-1 rounded-lg bg-danger/10 border border-danger/30 px-2.5 py-1 text-[10px] font-semibold text-danger hover:bg-danger/20 transition disabled:opacity-50"
                          >
                            <Ban className="h-3 w-3" />
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleWatch(t.id)}
                            disabled={actionLoading === t.id}
                            className="flex items-center gap-1 rounded-lg bg-warning/10 border border-warning/30 px-2.5 py-1 text-[10px] font-semibold text-warning hover:bg-warning/20 transition disabled:opacity-50"
                          >
                            <Eye className="h-3 w-3" />
                            Watch
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
