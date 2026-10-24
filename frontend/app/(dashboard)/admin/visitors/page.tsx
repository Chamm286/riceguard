"use client";
import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Activity, Search, MapPin, Clock, RefreshCw,
  AlertTriangle, Bot, Flag, Link as LinkIcon, X, ExternalLink, Globe, Eye, type LucideIcon
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
    <div className="space-y-6">
      <PageHeader
        title="Người truy cập"
        description="Giám sát lượt truy cập, vị trí IP và dấu hiệu bất thường"
        action={
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng lượt truy cập" value={formatNumber(visitorStats?.totalVisitors ?? visitors.length)} icon={Activity} />
        <StatCard label="24 giờ qua" value={formatNumber(visitorStats?.last24h ?? 0)} icon={Clock} color="gradient-cyber" delay={0.05} />
        <StatCard label="Cảnh báo nghiêm trọng" value={formatNumber(visitorStats?.alertCritical ?? 0)} icon={ShieldAlert} color="gradient-danger" delay={0.1} />
        <StatCard label="IP có cảnh báo" value={formatNumber(visitorStats?.alertUniqueIPs ?? 0)} icon={Globe} color="gradient-success" delay={0.15} />
      </div>

      {/* Live bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-success animate-ping opacity-30" />
          <div className="relative h-3 w-3 rounded-full bg-success" />
        </div>
        <span className="text-sm font-semibold text-success">Giám sát trực tiếp</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {visitors.length} visitor • {alerts.length} alert • {geoIPs.length} IP định vị
          {liveCount > 0 && ` • +${liveCount} mới`}
        </span>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border flex-wrap">
        <Tab active={tab === "alerts"} onClick={() => setTab("alerts")}>
          <ShieldAlert className="h-4 w-4" /> Cảnh báo bảo mật ({alerts.length})
        </Tab>
        <Tab active={tab === "logs"} onClick={() => setTab("logs")}>
          <Activity className="h-4 w-4" /> Nhật ký truy cập ({visitors.length})
        </Tab>
        <Tab active={tab === "map"} onClick={() => setTab("map")}>
          <Globe className="h-4 w-4" /> Bản đồ IP ({geoIPs.length})
        </Tab>
      </div>

      {/* Filters */}
      {tab === "alerts" && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo IP, tiêu đề, loại threat..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Tất cả mức độ</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "alerts" && (
          <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DataState
              loading={alertsQuery.loading}
              error={alertsQuery.error}
              empty={!alertsQuery.loading && !alertsQuery.error && filteredAlerts.length === 0}
              emptyText="Chưa có alert nào"
              onRetry={alertsQuery.refetch}
            >
              <div className="space-y-3">
                {filteredAlerts.map((a, i) => (
                  <AlertCard key={a.id} alert={a} index={i} onClick={() => setSelectedAlert(a)} />
                ))}
              </div>
            </DataState>
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
            <div className="overflow-x-auto max-h-[600px] rounded-2xl border border-border bg-card">
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
                <div className="rounded-2xl border border-border overflow-hidden">
                  <VisitorMap geoIPs={geoIPs} />
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="border-b border-border p-4">
                    <h3 className="font-semibold">Danh sách IP đã định vị ({geoIPs.length})</h3>
                  </div>
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {geoIPs.map((g) => (
                      <div key={g.ip_address} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                          <MapPin className="h-5 w-5 text-white" />
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

function AlertCard({ alert, index, onClick }: { alert: Alert; index: number; onClick: () => void }) {
  const icons: Record<string, LucideIcon> = { bot_detected: Bot, foreign_visitor: Flag, suspicious_path: LinkIcon, suspicious_ua: AlertTriangle };
  const colors: Record<string, { bg: string; border: string; text: string; grad: string }> = {
    critical: { bg: "bg-danger/10", border: "border-danger/40", text: "text-danger", grad: "gradient-danger" },
    high: { bg: "bg-warning/10", border: "border-warning/40", text: "text-warning", grad: "gradient-warning" },
    medium: { bg: "bg-cyber/10", border: "border-cyber/40", text: "text-cyber", grad: "gradient-cyber" },
    low: { bg: "bg-muted/10", border: "border-border", text: "text-muted-foreground", grad: "gradient-primary" },
  };
  const c = colors[alert.severity?.toLowerCase()] || colors.low;
  const Icon = icons[alert.threat_type] || AlertTriangle;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`w-full text-left rounded-2xl border ${c.border} ${c.bg} p-4 hover:shadow-lg hover:scale-[1.005] transition cursor-pointer`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.grad} shrink-0 shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{alert.title}</h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
              {alert.severity}
            </span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-accent/50 text-muted-foreground font-mono">
              {alert.threat_type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{alert.description}</p>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">🌐 {alert.ip_address}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(alert.created_at).toLocaleString("vi-VN")}</span>
            <span className="flex items-center gap-1 text-primary"><Eye className="h-3 w-3" />Chi tiết</span>
          </div>
        </div>
      </div>
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full rounded-2xl border border-border bg-card p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            alert.severity === "critical" ? "gradient-danger" : alert.severity === "high" ? "gradient-warning" : "gradient-primary"
          }`}>
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{alert.title}</h2>
            <p className="text-xs text-muted-foreground">Alert #{alert.id}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Row label="Loại threat" value={alert.threat_type} />
          <Row label="Mức độ" value={alert.severity.toUpperCase()} />
          <Row label="IP" value={alert.ip_address} mono />
          <Row label="Mô tả" value={alert.description} />
          <Row label="Trạng thái" value={alert.status} />
          <Row label="Thời gian" value={new Date(alert.created_at).toLocaleString("vi-VN")} />
        </div>

        <div className="mt-5 flex gap-3">
          <a href={`https://www.virustotal.com/gui/ip-address/${alert.ip_address}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-accent py-2.5 text-sm font-semibold hover:bg-accent/80 transition">
            <ExternalLink className="h-4 w-4" /> VirusTotal
          </a>
          <a href={`https://ipinfo.io/${alert.ip_address}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-accent py-2.5 text-sm font-semibold hover:bg-accent/80 transition">
            <Globe className="h-4 w-4" /> Xem vị trí IP
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32 shrink-0">{label}</p>
      <p className={`text-sm flex-1 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
