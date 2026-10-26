"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, AlertTriangle, FileText, TrendingUp, Activity, Zap,
  ArrowRight, PieChart as PieIcon, Clock, CircleDot, Volume2, VolumeX,
  Bell, RefreshCw, Lock, Globe2, ChevronLeft, ChevronRight, Gauge,
  Radio, Terminal
} from "lucide-react";
import { useApiData } from "@/hooks/use-api-data";
import AISummaryCard from "@/components/dashboard/AISummaryCard";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import type { AISummary } from "@/lib/ai-summary";
import type { GeoPoint } from "@/components/dashboard/ThreatMap";
import { formatNumber } from "@/lib/format";
import {
  AreaChart, Area, PieChart as RePie, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const ThreatMap = dynamic(() => import("@/components/dashboard/ThreatMap"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[260px] animate-pulse rounded-md border border-border bg-secondary/60" />,
});

interface Stats {
  totalAlerts: number;
  newAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  totalLogs: number;
  totalFields: number;
  blockedIPs: number;
  riskScore: number;
}

interface RecentAlert {
  id: number;
  title: string;
  severity: string;
  status: string;
  category?: string | null;
  alert_type?: string | null;
  ip_address?: string | null;
  created_at: string;
  field_name?: string | null;
}

interface TimelinePoint { date: string; count: number | string }
interface SeverityPoint { severity: string; count: number | string }
interface CategoryPoint { category: string | null; count: number | string }

interface LiveLog {
  id: number;
  severity: string;
  message: string;
  ip_address?: string | null;
  source?: string;
  created_at: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  online: boolean;
  latencyMs?: number;
}

const severityBadge: Record<string, string> = {
  low: "border-success/30 bg-success/10 text-success",
  medium: "border-warning/30 bg-warning/10 text-warning",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  warning: "border-warning/30 bg-warning/10 text-warning",
  warn: "border-warning/30 bg-warning/10 text-warning",
  error: "border-danger/30 bg-danger/10 text-danger",
  critical: "border-danger/30 bg-danger/10 text-danger",
};

const severityLabels: Record<string, string> = {
  critical: "Nghiêm trọng",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  warning: "Cảnh báo",
  warn: "Cảnh báo",
  error: "Lỗi",
};

const severityOrder = ["critical", "high", "medium", "low"];
const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#4ade80",
};

const statusLabels: Record<string, string> = {
  new: "Mới",
  acknowledged: "Đã ghi nhận",
  investigating: "Đang điều tra",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  false_positive: "Báo nhầm",
  blocked: "Đã chặn",
  processing: "Đang xử lý",
  pending: "Chờ xử lý",
  open: "Mở",
};

const typeLabels: Record<string, string> = {
  sql_injection: "SQL Injection",
  sqli: "SQL Injection",
  xss: "XSS",
  path_traversal: "Path Traversal",
  brute_force: "Brute Force",
  malware: "Malware",
  phishing: "Phishing",
  ddos: "DDoS",
  unauthorized_access: "Truy cập trái phép",
  reconnaissance: "Recon",
  web_visitor: "Web Visitor",
  unknown: "Khác",
  security: "Security",
};

const tooltipStyle = {
  background: "#0b1220",
  border: "1px solid #1b2a3f",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

function normalizeSeverity(value?: string) {
  return (value || "low").toLowerCase();
}

function labelType(value?: string | null) {
  if (!value) return "Khác";
  return typeLabels[value.toLowerCase()] || value.replace(/_/g, " ");
}

function labelAlertType(alert: RecentAlert) {
  const explicit = (alert.alert_type || "").toLowerCase();
  if (explicit && explicit !== "security") return labelType(explicit);
  return labelType(alert.category);
}

function labelStatus(value?: string | null) {
  if (!value) return "Không rõ";
  return statusLabels[value.toLowerCase()] || value.replace(/_/g, " ");
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

function riskMeta(score: number) {
  if (score >= 75) return { label: "NGHIÊM TRỌNG", className: "border-danger/40 bg-danger/10 text-danger" };
  if (score >= 50) return { label: "CAO", className: "border-orange-500/40 bg-orange-500/10 text-orange-400" };
  if (score >= 25) return { label: "TRUNG BÌNH", className: "border-warning/40 bg-warning/10 text-warning" };
  return { label: "THẤP", className: "border-success/40 bg-success/10 text-success" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAlertFlash, setNewAlertFlash] = useState<RecentAlert | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(3);
  const [page, setPage] = useState(1);
  const lastAlertIdRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  const statsQuery = useApiData<Stats>("/dashboard/stats", { pollMs: 3000 });
  const recentAlertsQuery = useApiData<RecentAlert[]>("/dashboard/recent-alerts", { pollMs: 3000 });
  const timelineQuery = useApiData<TimelinePoint[]>("/dashboard/alerts-timeline", { pollMs: 10000 });
  const severityQuery = useApiData<SeverityPoint[]>("/dashboard/alerts-by-severity", { pollMs: 10000 });
  const categoryQuery = useApiData<CategoryPoint[]>("/dashboard/alerts-by-category", { pollMs: 10000 });
  const logsQuery = useApiData<LiveLog[]>("/logs", { params: { limit: 8 }, pollMs: 5000 });
  const aiSummaryQuery = useApiData<AISummary>("/dashboard/ai-summary", { pollMs: 60000 });
  const systemQuery = useApiData<{ services: ServiceStatus[] }>("/system/status", { pollMs: 15000 });
  const mapQuery = useApiData<GeoPoint[]>("/visitors/map", { pollMs: 30000 });

  const stats = statsQuery.data;
  const recentAlerts = useMemo(() => recentAlertsQuery.data || [], [recentAlertsQuery.data]);
  const timeline = useMemo(() => timelineQuery.data || [], [timelineQuery.data]);
  const bySeverity = useMemo(() => severityQuery.data || [], [severityQuery.data]);
  const byCategory = useMemo(() => categoryQuery.data || [], [categoryQuery.data]);
  const liveLogs = useMemo(() => logsQuery.data || [], [logsQuery.data]);
  const mapPoints = useMemo(() => mapQuery.data || [], [mapQuery.data]);
  const aiSummary = aiSummaryQuery.data;
  const aiFresh = useMemo(
    () => Boolean(aiSummary && currentTime.getTime() - new Date(aiSummary.created_at).getTime() < 24 * 60 * 60 * 1000),
    [aiSummary, currentTime]
  );
  const services = useMemo(() => systemQuery.data?.services || [], [systemQuery.data]);
  const backendOnline = !statsQuery.error && !recentAlertsQuery.error;
  const lastUpdate = statsQuery.updatedAt;
  const riskScore = stats?.riskScore ?? 0;
  const risk = riskMeta(riskScore);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(recentAlerts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginatedAlerts = recentAlerts.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") Notification.requestPermission();
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
          new Notification("CẢNH BÁO AN NINH MẠNG", {
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
      setRefreshCountdown((prev) => (prev <= 1 ? 3 : prev - 1));
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) playAlarmSound("warning");
  };

  const refreshAll = () => {
    statsQuery.refetch();
    recentAlertsQuery.refetch();
    timelineQuery.refetch();
    severityQuery.refetch();
    categoryQuery.refetch();
    logsQuery.refetch();
    aiSummaryQuery.refetch();
    systemQuery.refetch();
    mapQuery.refetch();
  };

  const cards = [
    { label: "Tổng cảnh báo", value: stats?.totalAlerts ?? 0, icon: ShieldAlert, color: "gradient-primary", sub: "Tất cả sự kiện" },
    { label: "Nghiêm trọng", value: stats?.criticalAlerts ?? 0, icon: Zap, color: "gradient-danger", sub: "Chưa xử lý" },
    { label: "Cảnh báo mới", value: stats?.newAlerts ?? 0, icon: AlertTriangle, color: "gradient-warning", sub: "Đang chờ phân loại" },
    { label: "IP bị chặn", value: stats?.blockedIPs ?? 0, icon: Lock, color: "gradient-cyber", sub: "Firewall hiện hành" },
    { label: "Điểm rủi ro", value: `${riskScore}/100`, icon: Gauge, color: riskScore >= 50 ? "gradient-danger" : "gradient-warning", sub: risk.label },
    { label: "Nhật ký", value: stats?.totalLogs ?? 0, icon: FileText, color: "gradient-success", sub: "Log đã thu thập" },
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

  const severityRows = useMemo(() => {
    const totals = bySeverity.reduce<Record<string, number>>((acc, item) => {
      const key = normalizeSeverity(item.severity);
      acc[key] = (acc[key] || 0) + Number(item.count || 0);
      return acc;
    }, {});
    return severityOrder.map((key) => ({ key, label: severityLabels[key], value: totals[key] || 0 }));
  }, [bySeverity]);

  const categoryData = useMemo(() => {
    return byCategory
      .map((item) => ({ name: labelType(item.category), count: Number(item.count || 0) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [byCategory]);

  const serviceById = (id: string) => services.find((service) => service.id === id);

  return (
    <div className="space-y-4">
      <PageHeader
        title="SOC Dashboard"
        description="Trung tâm điều hành an ninh mạng — giám sát, phát hiện và ứng phó sự cố theo thời gian thực"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSound}
              aria-label="Bật tắt âm thanh cảnh báo"
              className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition ${
                soundEnabled ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              {soundEnabled ? "Alarm" : "Muted"}
            </button>
            <button
              onClick={refreshAll}
              className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${statsQuery.refreshing ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>
        }
      />

      {aiSummary && aiFresh && <AISummaryCard data={aiSummary} />}

      <AnimatePresence>
        {newAlertFlash && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              newAlertFlash.severity === "critical" ? "border-danger/40 bg-danger/5" : "border-warning/40 bg-warning/5"
            }`}
          >
            <Bell className={`h-4 w-4 shrink-0 ${newAlertFlash.severity === "critical" ? "text-danger" : "text-warning"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-muted-foreground">Cảnh báo mới</p>
              <p className="truncate text-sm font-medium">{newAlertFlash.title}</p>
            </div>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {new Date(newAlertFlash.created_at).toLocaleTimeString("vi-VN")}
            </span>
            <button
              onClick={() => router.push(`/alerts/${newAlertFlash.id}`)}
              className="h-7 rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground transition hover:bg-accent"
            >
              Xem
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="soc-panel soc-scan flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${backendOnline ? "bg-success" : "bg-danger"} opacity-60`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${backendOnline ? "bg-success" : "bg-danger"}`} />
          </span>
          <span className="uppercase tracking-[0.16em] text-primary">SOC Command</span>
        </span>
        <span className={`rounded border px-1.5 py-0.5 tracking-wider ${risk.className}`}>
          RỦI RO TỒN ĐỌNG {riskScore}/100 · {risk.label}
        </span>
        <span className="hidden items-center gap-3 md:flex">
          {[
            { id: "backend", label: "API" },
            { id: "database", label: "DB" },
            { id: "n8n", label: "n8n" },
            { id: "ai", label: "AI" },
          ].map((service) => {
            const status = serviceById(service.id);
            const online = service.id === "backend" ? backendOnline : Boolean(status?.online);
            return (
              <span key={service.id} className="flex items-center gap-1.5" title={status?.latencyMs ? `${status.latencyMs}ms` : ""}>
                <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success" : "bg-danger"}`} />
                {service.label}
              </span>
            );
          })}
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {currentTime.toLocaleTimeString("vi-VN")}
          </span>
          {lastUpdate && <span className="hidden lg:inline">SYNC {lastUpdate.toLocaleTimeString("vi-VN")}</span>}
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-primary" />
            {refreshCountdown}s
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card, i) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={typeof card.value === "number" ? formatNumber(card.value) : card.value}
            icon={card.icon}
            color={card.color}
            sub={card.sub}
            delay={i * 0.03}
            loading={statsQuery.loading && !stats}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="soc-panel p-4 xl:col-span-8"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                Lưu lượng tấn công 7 ngày
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Số lượng cảnh báo theo ngày</p>
            </div>
            <span className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[9px] tracking-wider text-primary">
              <CircleDot className="h-3 w-3 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="h-64">
            {timelineQuery.loading ? (
              <div className="h-full animate-pulse rounded-md bg-secondary/60" />
            ) : timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="socArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b2a3f" />
                  <XAxis
                    dataKey="date"
                    stroke="#8294ab"
                    fontSize={10}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  />
                  <YAxis stroke="#8294ab" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fill="url(#socArea)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Chưa có dữ liệu 7 ngày</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="soc-panel p-4 xl:col-span-4"
        >
          <div className="mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <PieIcon className="h-4 w-4 text-primary" />
              Phân loại mức độ
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Tỷ lệ theo severity</p>
          </div>
          <div className="relative h-[190px]">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                      {pieData.map((item) => (
                        <Cell key={item.key} fill={severityColors[item.key]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </RePie>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-semibold leading-none">{formatNumber(stats?.totalAlerts ?? 0)}</span>
                  <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Tổng alerts</span>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Chưa có dữ liệu</div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px]">
            {severityRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: severityColors[row.key] }} />
                  {row.label}
                </span>
                <span className="text-foreground">{formatNumber(row.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="soc-panel p-4 xl:col-span-4"
        >
          <div className="mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-primary" />
              Loại tấn công
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Phân bố theo category</p>
          </div>
          <div className="h-[260px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#1b2a3f" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fill: "#8294ab", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(56,189,248,0.06)" }} />
                  <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={13} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Chưa có dữ liệu category</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="soc-panel flex flex-col p-4 xl:col-span-8"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4 text-primary" />
                Bản đồ nguồn tấn công
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">GeoIP từ telemetry người truy cập</p>
            </div>
            <span className="flex items-center gap-1.5 rounded border border-border bg-secondary/60 px-2 py-1 font-mono text-[9px] text-muted-foreground">
              <Globe2 className="h-3 w-3" />
              {mapPoints.length} POINTS
            </span>
          </div>
          <div className="min-h-[260px] flex-1">
            <ThreatMap points={mapPoints} />
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="soc-panel overflow-hidden xl:col-span-8"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Sự kiện cảnh báo gần đây
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">20 cảnh báo mới nhất · cập nhật tự động</p>
            </div>
            <button
              onClick={() => router.push("/alerts")}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              Xem tất cả
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-secondary/60 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Thời gian</th>
                  <th className="px-3 py-2.5 font-medium">Sự kiện</th>
                  <th className="px-3 py-2.5 font-medium">Loại</th>
                  <th className="px-3 py-2.5 font-medium">IP nguồn</th>
                  <th className="px-3 py-2.5 font-medium">Mức độ</th>
                  <th className="px-3 py-2.5 font-medium">Trạng thái</th>
                  <th className="w-8 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {recentAlertsQuery.loading && recentAlerts.length === 0 ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-4 rounded bg-secondary/80" />
                      </td>
                    </tr>
                  ))
                ) : paginatedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Chưa có cảnh báo</td>
                  </tr>
                ) : (
                  paginatedAlerts.map((alert, index) => {
                    const severity = normalizeSeverity(alert.severity);
                    return (
                      <tr
                        key={alert.id}
                        onClick={() => router.push(`/alerts/${alert.id}`)}
                        className={`cursor-pointer transition hover:bg-primary/[0.06] ${index % 2 === 1 ? "bg-white/[0.015]" : ""} ${
                          alert.id === newAlertFlash?.id ? "bg-danger/[0.06]" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="max-w-[230px] px-3 py-2.5">
                          <p className="truncate font-medium text-foreground">{alert.title}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{alert.field_name || "Hệ thống"}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[10px] text-muted-foreground">
                          {labelAlertType(alert)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] text-foreground/90">
                          {alert.ip_address || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-medium ${severityBadge[severity] || severityBadge.low}`}>
                            {severityLabels[severity] || alert.severity}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${alert.status === "resolved" ? "bg-success" : alert.status === "new" ? "bg-danger" : "bg-warning"}`} />
                            {labelStatus(alert.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
            <span>
              {recentAlerts.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, recentAlerts.length)}`} / {recentAlerts.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage <= 1}
                className="flex h-6 w-6 items-center justify-center rounded border border-border transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span>TRANG {safePage}/{pageCount}</span>
              <button
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                disabled={safePage >= pageCount}
                className="flex h-6 w-6 items-center justify-center rounded border border-border transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="soc-panel p-4 xl:col-span-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Terminal className="h-4 w-4 text-primary" />
              Nhật ký trực tiếp
            </h3>
            <span className="flex items-center gap-1 font-mono text-[9px] text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              STREAM
            </span>
          </div>
          <div className="max-h-[380px] space-y-1.5 overflow-y-auto pr-1 font-mono text-[10px] scrollbar-thin">
            <AnimatePresence>
              {liveLogs.map((log) => {
                const severity = normalizeSeverity(log.severity);
                const color = severity === "critical" ? "text-danger" : severity === "error" ? "text-orange-400" : severity === "warning" ? "text-warning" : "text-primary";
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded border border-border/70 bg-background/60 px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-14 shrink-0 truncate uppercase ${color}`}>{log.severity}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground">{new Date(log.created_at).toLocaleTimeString("vi-VN")}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-foreground/85">{log.message}</p>
                    <p className="mt-0.5 text-muted-foreground">{log.ip_address || log.source || "internal"}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {liveLogs.length === 0 && (
              <div className="py-10 text-center text-muted-foreground">Đang chờ log...</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
