"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, ArrowRight, Bell, Clock, FileText, Gauge,
  Radio, RefreshCw, ShieldAlert, Terminal, TrendingUp, Zap, Eye,
} from "lucide-react";
import { useApiData } from "@/hooks/use-api-data";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { DataState } from "@/components/common/data-state";
import { formatNumber } from "@/lib/format";
import api, { getApiErrorMessage } from "@/lib/api";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

interface Stats { totalAlerts: number; newAlerts: number; criticalAlerts: number; totalLogs: number; }
interface RecentAlert { id: number; title: string; severity: string; status: string; ip_address?: string | null; created_at: string; }
interface LiveLog { id: number; severity: string; message: string; ip_address?: string | null; source?: string; created_at: string; }
interface TimelinePoint { date: string; count: number | string; }

const severityColor: Record<string, string> = {
  critical: "text-danger", high: "text-warning", medium: "text-cyber", low: "text-success",
};

export default function AnalystDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [investigating, setInvestigating] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const statsQuery = useApiData<Stats>("/dashboard/stats", { pollMs: 3000 });
  const alertsQuery = useApiData<RecentAlert[]>("/dashboard/recent-alerts", { pollMs: 3000 });
  const logsQuery = useApiData<LiveLog[]>("/logs", { params: { limit: 30 }, pollMs: 2000 });
  const timelineQuery = useApiData<TimelinePoint[]>("/dashboard/alerts-timeline", { pollMs: 5000 });

  const stats = statsQuery.data;
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);
  const logs = useMemo(() => logsQuery.data || [], [logsQuery.data]);
  const timeline = useMemo(() => timelineQuery.data || [], [timelineQuery.data]);

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const investigate = async (alert: RecentAlert) => {
    setInvestigating(alert.id);
    setNotice("");
    try {
      await api.post(`/alerts/${alert.id}/assign`, { assigned_to: user?.id });
      setNotice(`Đã gán cảnh báo #${alert.id} cho bạn`);
      alertsQuery.refetch();
    } catch (err) {
      setNotice(getApiErrorMessage(err));
    } finally {
      setInvestigating(null);
    }
  };

  const refreshAll = () => {
    statsQuery.refetch(); alertsQuery.refetch(); logsQuery.refetch(); timelineQuery.refetch();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analyst Console"
        description="Phân tích log, điều tra sự cố và theo dõi tấn công thời gian thực"
        action={
          <button onClick={refreshAll} className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <RefreshCw className={`h-3.5 w-3.5 ${statsQuery.refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      {notice && (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">{notice}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tổng cảnh báo" value={formatNumber(stats?.totalAlerts ?? 0)} icon={ShieldAlert} />
        <StatCard label="Cảnh báo mới" value={formatNumber(stats?.newAlerts ?? 0)} icon={AlertTriangle} color="gradient-warning" delay={0.05} />
        <StatCard label="Nguy hiểm" value={formatNumber(stats?.criticalAlerts ?? 0)} icon={Zap} color="gradient-danger" delay={0.1} />
        <StatCard label="Nhật ký" value={formatNumber(stats?.totalLogs ?? 0)} icon={FileText} color="gradient-cyber" delay={0.15} />
      </div>

      {/* ECG + Live Log */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* ECG Chart */}
        <div className="soc-panel flex flex-col p-4 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-primary" />
                Live Attack Monitor (ECG)
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Lưu lượng tấn công thời gian thực</p>
            </div>
            <span className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[9px] text-primary">
              <Radio className="h-3 w-3 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="h-52">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="ecgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b2a3f" />
                  <XAxis dataKey="date" stroke="#8294ab" fontSize={9} tickFormatter={(v) => new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} />
                  <YAxis stroke="#8294ab" fontSize={9} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fill="url(#ecgGrad)" isAnimationActive={true} animationDuration={500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Live Log Stream (Terminal) */}
        <div className="soc-panel flex flex-col p-4 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Terminal className="h-4 w-4 text-primary" />
              Live Log Stream
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-primary font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="h-52 overflow-y-auto rounded-md border border-border bg-[#0a0f14] p-2 font-mono text-[10px]">
            {logs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">Đang chờ log...</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="flex gap-2 border-b border-border/30 py-1">
                  <span className={`shrink-0 ${severityColor[l.severity?.toLowerCase()] || "text-muted-foreground"}`}>
                    [{l.severity?.toUpperCase()}]
                  </span>
                  <span className="text-muted-foreground">{l.ip_address || l.source}</span>
                  <span className="flex-1 truncate text-foreground/80">{l.message}</span>
                  <span className="shrink-0 text-muted-foreground/60">{new Date(l.created_at).toLocaleTimeString("vi-VN")}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Events table with Investigate button */}
      <div className="soc-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Sự kiện mới nhất
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">{alerts.length} events</span>
        </div>
        <DataState loading={alertsQuery.loading} error={alertsQuery.error} empty={!alertsQuery.loading && alerts.length === 0} emptyText="Chưa có sự kiện" onRetry={alertsQuery.refetch}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Tiêu đề</th>
                  <th className="px-4 py-2.5">IP</th>
                  <th className="px-4 py-2.5">Mức độ</th>
                  <th className="px-4 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5">Thời gian</th>
                  <th className="px-4 py-2.5">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 transition hover:bg-accent/30">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">#{a.id}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate">{a.title}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{a.ip_address || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${severityColor[a.severity?.toLowerCase()] || "text-muted-foreground"}`}>
                        {a.severity?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{a.status}</td>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString("vi-VN")}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => investigate(a)}
                        disabled={investigating === a.id}
                        className="flex h-7 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-[11px] font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
                      >
                        {investigating === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>
    </div>
  );
}
