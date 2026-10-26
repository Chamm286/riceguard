"use client";
import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Activity, Search, MapPin, Clock, RefreshCw,
  AlertTriangle, Bot, Flag, Link as LinkIcon, X, ExternalLink, Globe, Eye, Code, Terminal, type LucideIcon
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useApiData } from "@/hooks/use-api-data";
import { DataState } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { formatNumber } from "@/lib/format";
import VisitorMap from "./VisitorMap";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Visitor {
  id: number;
  ip_address: string;
  country?: string;
  country_name?: string;
  city?: string;
  isp?: string;
  user_agent?: string;
  message: string;
  created_at: string;
}

interface Alert {
  id: number;
  alert_type: string;
  threat_type: string;
  severity: string;
  title: string;
  description: string;
  ip_address: string;
  status: string;
  created_at: string;
}

interface GeoIP {
  ip_address: string;
  country?: string;
  country_name?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  timezone?: string;
  hits: number;
  last_seen: string;
}

interface VisitorStats {
  totalVisitors: number;
  last24h: number;
  alertTotal: number;
  alertCritical: number;
  alertUniqueIPs: number;
}

export default function VisitorsPage() {
  const [tab, setTab] = useState<"alerts" | "logs" | "map">("alerts");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [liveCount, setLiveCount] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const visitorsQuery = useApiData<Visitor[]>("/visitors", { params: { limit: 200 }, pollMs: 10000 });
  const alertsQuery = useApiData<Alert[]>("/visitors/alerts", { params: { limit: 200 }, pollMs: 10000 });
  const mapQuery = useApiData<GeoIP[]>("/visitors/map", { pollMs: 10000 });
  const statsQuery = useApiData<VisitorStats>("/visitors/stats", { pollMs: 30000 });

  const visitors = useMemo(() => visitorsQuery.data || [], [visitorsQuery.data]);
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);
  const geoIPs = useMemo(() => mapQuery.data || [], [mapQuery.data]);
  const visitorStats = statsQuery.data;

  const { refetch: refetchVisitors } = visitorsQuery;
  const { refetch: refetchAlerts } = alertsQuery;
  const { refetch: refetchMap } = mapQuery;
  const { refetch: refetchStats } = statsQuery;

  const fetchAll = () => {
    refetchVisitors();
    refetchAlerts();
    refetchMap();
    refetchStats();
  };

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    const refresh = () => {
      refetchVisitors();
      refetchAlerts();
      refetchMap();
      refetchStats();
    };

    socket.on("connect", () => console.log("🔌 Socket connected"));
    socket.on("new_visitor", () => {
      setLiveCount((c) => c + 1);
      setTimeout(refresh, 300);
    });

    socket.on("report_updated", () => {
      setTimeout(refresh, 300);
    });

    return () => {
      socket.disconnect();
    };
  }, [refetchVisitors, refetchAlerts, refetchMap, refetchStats]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const s = !search || a.ip_address?.includes(search) || a.title?.toLowerCase().includes(search.toLowerCase()) || a.threat_type?.toLowerCase().includes(search.toLowerCase());
      const sv = !severityFilter || a.severity?.toLowerCase() === severityFilter;
      return s && sv;
    });
  }, [alerts, search, severityFilter]);

  const filteredVisitors = useMemo(() => {
    if (!search) return visitors;
    return visitors.filter((v) =>
      v.ip_address?.includes(search) ||
      v.country_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [visitors, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Người truy cập"
        description="Giám sát lượt truy cập, vị trí IP và dấu hiệu bất thường"
        action={
          <button
            onClick={fetchAll}
            className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tổng lượt truy cập" value={formatNumber(visitorStats?.totalVisitors ?? visitors.length)} icon={Activity} />
        <StatCard label="24 giờ qua" value={formatNumber(visitorStats?.last24h ?? 0)} icon={Clock} color="gradient-cyber" delay={0.05} />
        <StatCard label="Cảnh báo nghiêm trọng" value={formatNumber(visitorStats?.alertCritical ?? 0)} icon={ShieldAlert} color="gradient-danger" delay={0.1} />
        <StatCard label="IP có cảnh báo" value={formatNumber(visitorStats?.alertUniqueIPs ?? 0)} icon={Globe} color="gradient-success" delay={0.15} />
      </div>

      {/* Live bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="font-medium text-foreground">Giám sát trực tiếp</span>
        </span>
        <span>{visitors.length} lượt truy cập</span>
        <span>{alerts.length} cảnh báo</span>
        <span>{geoIPs.length} IP định vị</span>
        {liveCount > 0 && <span className="text-success">+{liveCount} mới</span>}
      </div>

      <div className="inline-flex flex-wrap rounded-md border border-border bg-card p-0.5">
        <Tab active={tab === "alerts"} onClick={() => setTab("alerts")}>
          <ShieldAlert className="h-3.5 w-3.5" /> Cảnh báo <span className="text-muted-foreground">{alerts.length}</span>
        </Tab>
        <Tab active={tab === "logs"} onClick={() => setTab("logs")}>
          <Activity className="h-3.5 w-3.5" /> Truy cập <span className="text-muted-foreground">{visitors.length}</span>
        </Tab>
        <Tab active={tab === "map"} onClick={() => setTab("map")}>
          <Globe className="h-3.5 w-3.5" /> Bản đồ <span className="text-muted-foreground">{geoIPs.length}</span>
        </Tab>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "alerts" && (
          <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex flex-wrap gap-2 border-b border-border p-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo IP, tiêu đề, loại cảnh báo..."
                    className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-muted-foreground outline-none focus:border-primary/60"
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="critical">Nghiêm trọng</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
              <DataState
                loading={alertsQuery.loading}
                error={alertsQuery.error}
                empty={!alertsQuery.loading && !alertsQuery.error && filteredAlerts.length === 0}
                emptyText="Chưa có cảnh báo nào"
                onRetry={alertsQuery.refetch}
              >
                <div className="divide-y divide-border">
                  {filteredAlerts.map((a, i) => (
                    <AlertCard key={a.id} alert={a} index={i} onClick={() => setSelectedAlert(a)} />
                  ))}
                </div>
              </DataState>
            </div>
          </motion.div>
        )}

        {tab === "logs" && (
          <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DataState
              loading={visitorsQuery.loading}
              error={visitorsQuery.error}
              empty={!visitorsQuery.loading && !visitorsQuery.error && filteredVisitors.length === 0}
              emptyText="Chưa có lượt truy cập nào"
              onRetry={visitorsQuery.refetch}
            >
            <div className="overflow-x-auto max-h-[600px] rounded-lg border border-border bg-card">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border bg-accent/30">
                    <Th>IP</Th><Th>Vị trí</Th><Th>Nhà mạng</Th><Th>Thiết bị</Th><Th>Hoạt động</Th><Th>Thời gian</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.slice(0, 200).map((v, i) => (
                    <motion.tr key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.005 }}
                      className="border-b border-border last:border-0 hover:bg-accent/30 transition">
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{v.ip_address}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {v.city || "?"}, {v.country_name || v.country || "?"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{v.isp || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{shortUA(v.user_agent)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{v.message}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleTimeString("vi-VN")}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            </DataState>
          </motion.div>
        )}

        {tab === "map" && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DataState
              loading={mapQuery.loading}
              error={mapQuery.error}
              empty={!mapQuery.loading && !mapQuery.error && geoIPs.length === 0}
              emptyText="Chưa có IP nào có tọa độ"
              onRetry={mapQuery.refetch}
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-border overflow-hidden">
                  <VisitorMap geoIPs={geoIPs} />
                </div>

                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="border-b border-border p-4">
                    <h3 className="font-semibold">Danh sách IP đã định vị ({geoIPs.length})</h3>
                  </div>
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {geoIPs.map((g) => (
                      <div key={g.ip_address} className="flex items-center gap-3 p-3 transition hover:bg-accent/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-primary">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-semibold">{g.ip_address}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.city || "?"}, {g.region || "?"}, {g.country_name || g.country || "?"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            ISP: {g.isp || "?"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{g.hits}</p>
                          <p className="text-[10px] text-muted-foreground">hits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DataState>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {selectedAlert && <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}
      </AnimatePresence>
    </div>
  );
}

const alertTypeLabels: Record<string, string> = {
  sql_injection: "SQL Injection",
  xss: "XSS",
  path_traversal: "Path Traversal",
  command_injection: "Command Injection",
  brute_force: "Brute Force",
  bot_detected: "Bot",
  foreign_visitor: "IP nước ngoài",
  suspicious_path: "Đường dẫn đáng ngờ",
  suspicious_ua: "User-Agent đáng ngờ",
  security_event: "Sự kiện bảo mật",
  security: "Bảo mật",
};

const alertSeverityLabels: Record<string, string> = {
  critical: "Nghiêm trọng",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  warn: "Cảnh báo",
};

const alertStatusLabels: Record<string, string> = {
  blocked: "Đã chặn",
  new: "Mới",
  reviewing: "Đang xem xét",
  resolved: "Đã xử lý",
};

function alertType(alert: Alert) {
  const type = (alert.alert_type || "").toLowerCase();
  const threat = (alert.threat_type || "").toLowerCase();
  const generic = ["security", "security_event"];
  if (type && !generic.includes(type)) return type;
  if (threat && !generic.includes(threat)) return threat;
  return type || threat || "security";
}

function normalizeSeverity(value?: string) {
  return (value || "low").toLowerCase();
}

function AlertCard({ alert, index, onClick }: { alert: Alert; index: number; onClick: () => void }) {
  const icons: Record<string, LucideIcon> = {
    sql_injection: ShieldAlert,
    xss: Code,
    path_traversal: LinkIcon,
    command_injection: Terminal,
    brute_force: ShieldAlert,
    bot_detected: Bot,
    foreign_visitor: Flag,
    suspicious_path: LinkIcon,
    suspicious_ua: AlertTriangle,
  };
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: "bg-danger/10", border: "border-danger/25", text: "text-danger" },
    high: { bg: "bg-warning/10", border: "border-warning/25", text: "text-warning" },
    medium: { bg: "bg-cyber/10", border: "border-cyber/25", text: "text-cyber" },
    low: { bg: "bg-success/10", border: "border-success/25", text: "text-success" },
  };
  const severity = normalizeSeverity(alert.severity);
  const c = colors[severity] || colors.low;
  const type = alertType(alert);
  const Icon = icons[type] || AlertTriangle;
  const typeLabel = alertTypeLabels[type] || type.replace(/_/g, " ");

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.01, 0.15) }}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/40"
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${c.border} ${c.bg} ${c.text}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium">{alert.title}</p>
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium ${c.border} ${c.bg} ${c.text}`}>
            {alertSeverityLabels[severity] || alert.severity}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{alert.description || "Không có mô tả"}</p>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground md:hidden">
          <span className="font-mono">{alert.ip_address}</span>
          <span>{new Date(alert.created_at).toLocaleString("vi-VN")}</span>
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-4 text-[10px] text-muted-foreground md:flex">
        <span className="w-32 font-mono">{alert.ip_address}</span>
        <span className="w-32 text-right">{new Date(alert.created_at).toLocaleString("vi-VN")}</span>
        <span className="w-28 truncate rounded border border-border bg-background px-1.5 py-0.5 text-center font-mono uppercase text-muted-foreground">
          {typeLabel}
        </span>
      </div>
      <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition group-hover:text-foreground" />
    </motion.button>
  );
}

function AlertModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-lg border border-border bg-card p-5"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${
            normalizeSeverity(alert.severity) === "critical" ? "border-danger/25 bg-danger/10 text-danger" : normalizeSeverity(alert.severity) === "high" ? "border-warning/25 bg-warning/10 text-warning" : "border-border bg-background text-primary"
          }`}>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{alert.title}</h2>
            <p className="text-xs text-muted-foreground">Alert #{alert.id}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Row label="Loại cảnh báo" value={alertTypeLabels[alertType(alert)] || alertType(alert).replace(/_/g, " ")} />
          <Row label="Mức độ" value={alertSeverityLabels[normalizeSeverity(alert.severity)] || alert.severity} />
          <Row label="IP" value={alert.ip_address} mono />
          <Row label="Mô tả" value={alert.description} />
          <Row label="Trạng thái" value={alertStatusLabels[alert.status?.toLowerCase()] || alert.status} />
          <Row label="Thời gian" value={new Date(alert.created_at).toLocaleString("vi-VN")} />
        </div>

        <div className="mt-4 flex gap-2">
          <a href={`https://www.virustotal.com/gui/ip-address/${alert.ip_address}`} target="_blank" rel="noopener noreferrer"
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background text-xs font-medium transition hover:bg-accent">
            <ExternalLink className="h-4 w-4" /> VirusTotal
          </a>
          <a href={`https://ipinfo.io/${alert.ip_address}`} target="_blank" rel="noopener noreferrer"
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background text-xs font-medium transition hover:bg-accent">
            <Globe className="h-4 w-4" /> Xem vị trí IP
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 border-b border-border py-2 last:border-0">
      <p className="w-28 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`flex-1 text-xs ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium transition ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}>
      {children}
    </button>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-accent/30">{children}</th>;
}

function shortUA(ua?: string) {
  if (!ua) return "—";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("curl")) return "curl";
  if (ua.includes("bot") || ua.includes("Bot") || ua.includes("sqlmap")) return "🤖 Bot";
  return ua.substring(0, 30);
}
