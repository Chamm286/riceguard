"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldAlert, Download, RefreshCw, Volume2, VolumeX, Bell } from "lucide-react";
import api from "@/lib/api";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  field_name?: string;
  created_at: string;
}

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

const statusColor: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/30",
  processing: "bg-warning/10 text-warning border-warning/30",
  resolved: "bg-success/10 text-success border-success/30",
  ignored: "bg-muted text-muted-foreground border-border",
};

function playAlarmSound(type: "critical" | "warning" = "critical") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const beep = (startTime: number, freq: number, duration: number, waveType: OscillatorType = "sawtooth") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + duration);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    if (type === "critical") {
      beep(now, 1200, 0.15);
      beep(now + 0.25, 1200, 0.15);
      beep(now + 0.5, 1500, 0.3);
    } else {
      beep(now, 800, 0.2, "sine");
      beep(now + 0.3, 800, 0.2, "sine");
    }
    setTimeout(() => ctx.close().catch(() => {}), 2000);
  } catch (e) {}
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAlertFlash, setNewAlertFlash] = useState<Alert | null>(null);
  const lastAlertIdRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  const fetchData = () => {
    setLoading(true);
    api.get("/alerts", { params: { search, severity, status, limit: 50 } })
      .then((r) => {
        const newAlerts = r.data.data;
        if (newAlerts.length > 0) {
          const latestAlert = newAlerts[0];

          if (isFirstLoadRef.current) {
            lastAlertIdRef.current = latestAlert.id;
            isFirstLoadRef.current = false;
          } else if (latestAlert.id > lastAlertIdRef.current) {
            if (soundEnabled) {
              if (latestAlert.severity === "critical") playAlarmSound("critical");
              else if (latestAlert.severity === "high") playAlarmSound("warning");
            }
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification("🚨 CẢNH BÁO MỚI", {
                  body: latestAlert.title,
                  tag: `alert-${latestAlert.id}`,
                });
              } catch (e) {}
            }
            setNewAlertFlash(latestAlert);
            setTimeout(() => setNewAlertFlash(null), 4000);
          }
          lastAlertIdRef.current = latestAlert.id;
        }
        setAlerts(newAlerts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [search, severity, status, autoRefresh, soundEnabled]);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) playAlarmSound("warning");
  };

  const exportCSV = () => {
    const headers = ["ID", "Tiêu đề", "Mô tả", "Mức độ", "Loại", "Trạng thái", "Thời gian"];
    const rows = alerts.map((a) => [
      a.id,
      `"${(a.title || "").replace(/"/g, '""')}"`,
      `"${(a.description || "").replace(/"/g, '""')}"`,
      a.severity, a.category, a.status,
      new Date(a.created_at).toLocaleString("vi-VN"),
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    new: alerts.filter((a) => a.status === "new").length,
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {newAlertFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`rounded-2xl border-2 p-4 flex items-center gap-4 ${
              newAlertFlash.severity === "critical" ? "border-danger bg-danger/10" : "border-warning bg-warning/10"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl animate-pulse ${
              newAlertFlash.severity === "critical" ? "gradient-danger" : "gradient-warning"
            }`}>
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-danger">🔔 CẢNH BÁO MỚI</p>
              <p className="font-bold">{newAlertFlash.title}</p>
              <p className="text-xs text-muted-foreground">
                {newAlertFlash.severity.toUpperCase()} • {new Date(newAlertFlash.created_at).toLocaleTimeString("vi-VN")}
              </p>
            </div>
            <button
              onClick={() => router.push(`/alerts/${newAlertFlash.id}`)}
              className="rounded-lg gradient-danger px-4 py-2 text-xs font-semibold text-white"
            >
              Xem ngay
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng alert", value: stats.total, color: "text-primary" },
          { label: "Critical", value: stats.critical, color: "text-danger" },
          { label: "High", value: stats.high, color: "text-warning" },
          { label: "Mới", value: stats.new, color: "text-cyber" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 flex items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5 focus-within:border-primary/50 transition">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm cảnh báo..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none">
          <option value="">Tất cả mức độ</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới</option>
          <option value="processing">Đang xử lý</option>
          <option value="resolved">Đã xử lý</option>
          <option value="ignored">Bỏ qua</option>
        </select>

        <button onClick={handleToggleSound} className={`h-11 rounded-xl border px-4 text-sm font-medium transition flex items-center gap-2 ${soundEnabled ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card"}`}>
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <button onClick={() => setAutoRefresh(!autoRefresh)} className={`h-11 rounded-xl border px-4 text-sm font-medium transition flex items-center gap-2 ${autoRefresh ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card"}`}>
          <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "2s" }} />
          {autoRefresh ? "Live" : "Paused"}
        </button>

        <button onClick={exportCSV} className="h-11 rounded-xl gradient-primary px-4 text-sm font-semibold text-white glow hover:opacity-90 transition flex items-center gap-2">
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">ID</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Tiêu đề</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Loại</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Mức độ</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Trạng thái</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && alerts.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Đang tải...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Không có cảnh báo</td></tr>
              ) : (
                alerts.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => router.push(`/alerts/${a.id}`)}
                    className={`hover:bg-accent/30 transition cursor-pointer ${a.id === newAlertFlash?.id ? "bg-danger/5 animate-pulse" : ""}`}
                  >
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">#{a.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                          a.severity === "critical" ? "gradient-danger" :
                          a.severity === "high" ? "gradient-warning" : "gradient-primary"
                        }`}>
                          <ShieldAlert className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-md">{a.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-cyber/10 border border-cyber/30 px-2.5 py-0.5 text-[10px] font-medium text-cyber capitalize">
                        {a.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[a.severity] || ""}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColor[a.status] || ""}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("vi-VN")}
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
