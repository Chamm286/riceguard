"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, AlertTriangle, CheckCircle, FileText, MapPin, TrendingUp,
  Activity, Zap, ArrowRight, PieChart, Clock, Server, CircleDot,
  Volume2, VolumeX, Bell, RefreshCw, Sparkles
} from "lucide-react";
import { useApiData } from "@/hooks/use-api-data";
import AISummaryCard from "@/components/dashboard/AISummaryCard";
import type { AISummary } from "@/lib/ai-summary";
import { formatNumber } from "@/lib/format";
import {
  AreaChart, Area, PieChart as RePie, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

interface Stats {
  totalAlerts: number;
  newAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  totalLogs: number;
  totalFields: number;
}

interface RecentAlert {
  id: number;
  title: string;
  severity: string;
  created_at: string;
  field_name?: string | null;
}

interface TimelinePoint {
  date: string;
  count: number | string;
}

interface SeverityPoint {
  severity: string;
  count: number | string;
}

interface LiveLog {
  id: number;
  severity: string;
  message: string;
  ip_address?: string | null;
  source?: string;
  created_at: string;
}

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

const severityLabels: Record<string, string> = {
  critical: "Nghiêm trọng",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const severityOrder = ["critical", "high", "medium", "low"];
const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

function normalizeSeverity(value?: string) {
  return (value || "low").toLowerCase();
}

function playAlarmSound(type: "critical" | "warning" = "critical") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

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
  } catch {}
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAlertFlash, setNewAlertFlash] = useState<RecentAlert | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(3);
  const lastAlertIdRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  const statsQuery = useApiData<Stats>("/dashboard/stats", { pollMs: 2000 });
  const recentAlertsQuery = useApiData<RecentAlert[]>("/dashboard/recent-alerts", { pollMs: 2000 });
  const timelineQuery = useApiData<TimelinePoint[]>("/dashboard/alerts-timeline", { pollMs: 5000 });
  const severityQuery = useApiData<SeverityPoint[]>("/dashboard/alerts-by-severity", { pollMs: 5000 });
  const logsQuery = useApiData<LiveLog[]>("/logs", { params: { limit: 6 }, pollMs: 5000 });
  const aiSummaryQuery = useApiData<AISummary>("/dashboard/ai-summary", { pollMs: 60000 });

  const stats = statsQuery.data;
  const recentAlerts = useMemo(() => recentAlertsQuery.data || [], [recentAlertsQuery.data]);
  const timeline = useMemo(() => timelineQuery.data || [], [timelineQuery.data]);
  const bySeverity = useMemo(() => severityQuery.data || [], [severityQuery.data]);
  const liveLogs = useMemo(() => logsQuery.data || [], [logsQuery.data]);
  const aiSummary = aiSummaryQuery.data;
  const backendOnline = !statsQuery.error && !recentAlertsQuery.error;
  const lastUpdate = statsQuery.updatedAt;

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!recentAlerts.length) return;
    const latestAlert = recentAlerts[0];

    if (isFirstLoadRef.current) {
      lastAlertIdRef.current = latestAlert.id;
      isFirstLoadRef.current = false;
      return;
    }

    if (latestAlert.id > lastAlertIdRef.current) {
      if (soundEnabled) {
        if (latestAlert.severity === "critical") playAlarmSound("critical");
        else if (latestAlert.severity === "high") playAlarmSound("warning");
      }

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🚨 CẢNH BÁO AN NINH MẠNG", {
            body: `${latestAlert.title}\nMức độ: ${latestAlert.severity.toUpperCase()}`,
            icon: "/favicon.ico",
            tag: `alert-${latestAlert.id}`,
          });
        } catch {}
      }

      setNewAlertFlash(latestAlert);
      setTimeout(() => setNewAlertFlash(null), 6000);
    }

    lastAlertIdRef.current = latestAlert.id;
  }, [recentAlerts, soundEnabled]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 2 : prev - 1));
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) playAlarmSound("warning");
  };

  const cards = [
    { label: "Tổng cảnh báo", value: stats?.totalAlerts ?? 0, icon: ShieldAlert, color: "gradient-primary" },
    { label: "Cảnh báo mới", value: stats?.newAlerts ?? 0, icon: AlertTriangle, color: "gradient-warning" },
    { label: "Nguy hiểm", value: stats?.criticalAlerts ?? 0, icon: Zap, color: "gradient-danger" },
    { label: "Đã xử lý", value: stats?.resolvedAlerts ?? 0, icon: CheckCircle, color: "gradient-success" },
    { label: "Nhật ký", value: stats?.totalLogs ?? 0, icon: FileText, color: "gradient-cyber" },
    { label: "Vùng canh tác", value: stats?.totalFields ?? 0, icon: MapPin, color: "gradient-primary" },
  ];

  const pieData = useMemo(() => {
    const totals = bySeverity.reduce<Record<string, number>>((acc, item) => {
      const key = normalizeSeverity(item.severity);
      acc[key] = (acc[key] || 0) + Number(item.count || 0);
      return acc;
    }, {});
    return severityOrder
      .filter((key) => totals[key] > 0)
      .map((key) => ({ key, name: severityLabels[key], value: totals[key] }));
  }, [bySeverity]);

  return (
    <div className="space-y-6">
      {/* 🤖 AI Summary Card — Từ A9 SOC Copilot */}
      {aiSummary && <AISummaryCard data={aiSummary} />}

      <AnimatePresence>
        {newAlertFlash && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`rounded-2xl border-2 p-4 flex items-center gap-4 ${
              newAlertFlash.severity === "critical"
                ? "border-danger bg-danger/10 animate-pulse"
                : "border-warning bg-warning/10"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              newAlertFlash.severity === "critical" ? "gradient-danger" : "gradient-warning"
            } animate-pulse`}>
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                🚨 CẢNH BÁO MỚI
              </p>
              <p className="font-semibold">{newAlertFlash.title}</p>
              <p className="text-xs text-muted-foreground">
                Mức độ: <span className="font-bold uppercase">{newAlertFlash.severity}</span> • {new Date(newAlertFlash.created_at).toLocaleTimeString("vi-VN")}
              </p>
            </div>
            <button
              onClick={() => router.push(`/alerts/${newAlertFlash.id}`)}
              className="rounded-lg gradient-primary px-4 py-2 text-xs font-semibold text-white glow"
            >
              Xem ngay
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-cyber/5 to-transparent p-4 flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-semibold">{backendOnline ? "Hệ thống đang hoạt động" : "Mất kết nối backend"}</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Server className="h-3.5 w-3.5 text-primary" />
          <span>Backend: <span className={backendOnline ? "text-success font-mono" : "text-danger font-mono"}>{backendOnline ? "ONLINE" : "OFFLINE"}</span></span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 text-cyber animate-spin" style={{ animationDuration: "2s" }} />
          <span>Refresh: <span className="text-primary font-mono">{refreshCountdown}s</span></span>
        </div>

        {lastUpdate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>Cập nhật: <span className="text-success font-mono">{lastUpdate.toLocaleTimeString("vi-VN")}</span></span>
          </div>
        )}

        <button
          onClick={handleToggleSound}
          className={`ml-auto flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
            soundEnabled
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {soundEnabled ? "Âm thanh ON" : "Âm thanh OFF"}
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {currentTime.toLocaleTimeString("vi-VN")}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="hover-lift rounded-2xl border border-border bg-card p-4 group"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} group-hover:scale-110 transition`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{formatNumber(card.value)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Xu hướng cảnh báo 7 ngày
              </h3>
              <p className="text-xs text-muted-foreground">Số lượng cảnh báo theo ngày</p>
            </div>
            <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[10px] font-medium text-primary flex items-center gap-1">
              <CircleDot className="h-3 w-3 animate-pulse" />
              TRỰC TIẾP
            </span>
          </div>
          <div className="h-64">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a26" />
                  <XAxis
                    dataKey="date"
                    stroke="#8fa89d"
                    fontSize={11}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  />
                  <YAxis stroke="#8fa89d" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#111a17", border: "1px solid #1e2a26", borderRadius: "12px", fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-5">
            <h3 className="font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Phân loại mức độ
            </h3>
            <p className="text-xs text-muted-foreground">Theo mức độ nghiêm trọng</p>
          </div>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((item) => (
                      <Cell key={item.key} fill={severityColors[item.key]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111a17", border: "1px solid #1e2a26", borderRadius: "12px", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-muted-foreground">{value}</span>} />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Nhật ký trực tiếp
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-primary font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              TRỰC TIẾP
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin font-mono text-xs">
            <AnimatePresence>
              {liveLogs.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-accent/30 border-l-2 border-primary"
                >
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                    normalizeSeverity(l.severity) === "critical" ? "bg-danger/20 text-danger" :
                    normalizeSeverity(l.severity) === "error" ? "bg-orange-500/20 text-orange-500" :
                    normalizeSeverity(l.severity) === "warning" ? "bg-warning/20 text-warning" :
                    "bg-primary/20 text-primary"
                  }`}>
                    {l.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[11px]">{l.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {l.ip_address || l.source} • {new Date(l.created_at).toLocaleTimeString("vi-VN")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {liveLogs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Đang chờ log...</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Cảnh báo gần đây
              </h3>
              <p className="text-xs text-muted-foreground">10 cảnh báo mới nhất</p>
            </div>
            <button
              onClick={() => router.push("/alerts")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
            {recentAlerts.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
            ) : (
              recentAlerts.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/alerts/${a.id}`)}
                  className={`flex items-center gap-4 p-4 hover:bg-accent/30 transition cursor-pointer ${
                    a.id === newAlertFlash?.id ? "bg-danger/5 animate-pulse" : ""
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                    normalizeSeverity(a.severity) === "critical" ? "gradient-danger" :
                    normalizeSeverity(a.severity) === "high" ? "gradient-warning" : "gradient-primary"
                  }`}>
                    <ShieldAlert className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {a.field_name || "Hệ thống"} • {new Date(a.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[normalizeSeverity(a.severity)] || ""}`}>
                    {severityLabels[normalizeSeverity(a.severity)] || a.severity}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
