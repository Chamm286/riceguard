'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, Database, Download, FileText, Filter,
  RefreshCw, Search, Shield, User,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { formatDateTime, formatNumber } from '@/lib/format';

interface AuditLog {
  id: number;
  source: string;
  event_type: string;
  severity: string;
  ip_address: string | null;
  message: string;
  created_at: string;
}

const severityStyle: Record<string, string> = {
  critical: 'bg-danger/10 text-danger border-danger/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-success/10 text-success border-success/30',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const { data, error, loading, refreshing, refetch } = useApiData<AuditLog[]>('/audit', { pollMs: 20000 });
  const logs = useMemo(() => data || [], [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchSeverity = severity === 'all' || log.severity === severity;
      const matchSearch =
        !query ||
        log.message?.toLowerCase().includes(query) ||
        log.source?.toLowerCase().includes(query) ||
        log.event_type?.toLowerCase().includes(query) ||
        log.ip_address?.toLowerCase().includes(query);
      return matchSeverity && matchSearch;
    });
  }, [logs, search, severity]);

  const exportCsv = () => {
    const rows = [
      ['id', 'source', 'event_type', 'severity', 'ip_address', 'message', 'created_at'],
      ...filtered.map((log) => [log.id, log.source, log.event_type, log.severity, log.ip_address || '', log.message || '', log.created_at]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riceguard-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={`${formatNumber(logs.length)} sự kiện gần nhất từ bảng logs`}
        action={
          <div className="flex gap-2">
            <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent transition">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button onClick={refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm message, IP, event type..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-11 bg-transparent text-sm outline-none">
              <option value="all">Tất cả mức độ</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <span className="flex items-center rounded-xl bg-accent px-3 text-xs text-muted-foreground">{filtered.length} kết quả</span>
        </div>
      </div>

      <DataState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyText="Không có log phù hợp" onRetry={refetch}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border">
            {filtered.map((log, index) => {
              const Icon = log.source === 'auth' ? User : log.event_type?.includes('sql') || log.event_type?.includes('xss') ? Shield : log.source === 'postgres' ? Database : Activity;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.015, 0.3) }}
                  className="flex items-start gap-4 p-4 hover:bg-accent/30 transition"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    log.severity === 'critical' ? 'gradient-danger' :
                    log.severity === 'high' ? 'gradient-warning' :
                    log.severity === 'warning' ? 'gradient-warning' : 'gradient-primary'
                  }`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{log.event_type || 'event'}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityStyle[log.severity] || severityStyle.info}`}>
                        {log.severity || 'info'}
                      </span>
                      <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{log.source || 'unknown'}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{log.message || '—'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="font-mono">{log.ip_address || 'no-ip'}</span>
                      <span>{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>
                  <span className="hidden text-[10px] text-muted-foreground md:block">#{log.id}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </DataState>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Nguồn: bảng logs</span>
        <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Tự cập nhật mỗi 20 giây</span>
      </div>
    </div>
  );
}
