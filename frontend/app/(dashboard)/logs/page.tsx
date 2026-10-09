"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Search, RefreshCw } from "lucide-react";
import api from "@/lib/api";

interface Log {
  id: number;
  source: string;
  event_type: string;
  severity: string;
  ip_address: string;
  message: string;
  created_at: string;
}

const severityColor: Record<string, string> = {
  info: "bg-cyber/10 text-cyber border-cyber/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  error: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = () => {
    api.get("/logs", { params: { search, severity, source, limit: 100 } })
      .then((r) => setLogs(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [search, severity, source, autoRefresh]);

  const exportCSV = () => {
    const headers = ["ID", "Thời gian", "Nguồn", "Sự kiện", "IP", "Mức độ", "Thông điệp"];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.created_at).toLocaleString("vi-VN"),
      l.source, l.event_type, l.ip_address || "", l.severity,
      `"${(l.message || "").replace(/"/g, '""')}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 flex items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5 focus-within:border-primary/50 transition">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm log..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none">
          <option value="">Tất cả mức độ</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none">
          <option value="">Tất cả nguồn</option>
          <option value="ssh">SSH</option>
          <option value="nginx">Nginx</option>
          <option value="nginx_error">Nginx Error</option>
        </select>

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
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-xs uppercase sticky top-0">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">ID</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Thời gian</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Nguồn</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Sự kiện</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">IP</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Mức độ</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Thông điệp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Đang tải...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Không có log</td></tr>
              ) : (
                logs.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.005 }}
                    className="hover:bg-accent/30 transition"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{l.id}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium">
                        {l.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono">{l.event_type}</td>
                    <td className="px-5 py-3 font-mono text-xs">{l.ip_address || "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[l.severity] || ""}`}>
                        {l.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs max-w-md truncate">{l.message}</td>
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
