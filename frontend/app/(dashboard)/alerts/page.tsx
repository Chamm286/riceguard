'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, Search, ShieldAlert,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatDateTime, formatNumber } from '@/lib/format';

interface Alert {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  category: string | null;
  status: string;
  alert_type: string | null;
  ip_address: string | null;
  assigned_name: string | null;
  field_name: string | null;
  created_at: string;
}

const severityColor: Record<string, string> = {
  low: 'border-success/30 bg-success/10 text-success',
  medium: 'border-warning/30 bg-warning/10 text-warning',
  high: 'border-orange-500/30 bg-orange-500/10 text-orange-500',
  critical: 'border-danger/30 bg-danger/10 text-danger',
};

const statusColor: Record<string, string> = {
  new: 'border-primary/30 bg-primary/10 text-primary',
  processing: 'border-warning/30 bg-warning/10 text-warning',
  resolved: 'border-success/30 bg-success/10 text-success',
  ignored: 'border-border bg-accent text-muted-foreground',
  blocked: 'border-danger/30 bg-danger/10 text-danger',
};

const statusLabel: Record<string, string> = {
  new: 'Mới',
  processing: 'Đang xử lý',
  resolved: 'Đã xử lý',
  ignored: 'Bỏ qua',
  blocked: 'Đã block',
};

function extractIP(text: string | null | undefined) {
  const match = text?.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  return match ? match[0] : null;
}

function alertIP(alert: Alert) {
  return alert.ip_address || extractIP(`${alert.title} ${alert.description || ''}`) || '—';
}

export default function AlertsPage() {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');

  const alertsQuery = useApiData<Alert[]>('/alerts', { pollMs: 30000 });
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return alerts.filter((alert) => {
      const matchSeverity = severity === 'all' || alert.severity === severity;
      const matchStatus = status === 'all' || alert.status === status;
      const matchSearch =
        !query ||
        alert.title?.toLowerCase().includes(query) ||
        alert.description?.toLowerCase().includes(query) ||
        alert.ip_address?.toLowerCase().includes(query) ||
        extractIP(`${alert.title} ${alert.description || ''}`)?.includes(query) ||
        alert.assigned_name?.toLowerCase().includes(query);
      return matchSeverity && matchStatus && matchSearch;
    });
  }, [alerts, search, severity, status]);

  const stats = useMemo(() => ({
    total: alerts.length,
    new: alerts.filter((alert) => alert.status === 'new').length,
    processing: alerts.filter((alert) => alert.status === 'processing').length,
    critical: alerts.filter((alert) => alert.severity === 'critical').length,
  }), [alerts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cảnh báo"
        description="Cảnh báo an ninh và nông nghiệp từ database, cập nhật realtime"
        action={
          <button
            onClick={alertsQuery.refetch}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50"
          >
            <RefreshCw className={`h-4 w-4 ${alertsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng cảnh báo" value={formatNumber(stats.total)} icon={ShieldAlert} />
        <StatCard label="Cảnh báo mới" value={formatNumber(stats.new)} icon={Activity} color="gradient-cyber" delay={0.05} />
        <StatCard label="Đang xử lý" value={formatNumber(stats.processing)} icon={Clock} color="gradient-warning" delay={0.1} />
        <StatCard label="Nguy hiểm" value={formatNumber(stats.critical)} icon={AlertTriangle} color="gradient-danger" delay={0.15} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5 focus-within:border-primary/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tiêu đề, IP, người xử lý..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50">
          <option value="all">Tất cả mức độ</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50">
          <option value="all">Tất cả trạng thái</option>
          <option value="new">Mới</option>
          <option value="processing">Đang xử lý</option>
          <option value="resolved">Đã xử lý</option>
          <option value="ignored">Bỏ qua</option>
          <option value="blocked">Đã block</option>
        </select>
        <span className="flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[10px] font-semibold text-danger">
          <Activity className="h-3 w-3 animate-pulse" /> LIVE 30s
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-danger" />Danh sách cảnh báo</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} kết quả</p>
          </div>
          {alertsQuery.updatedAt && (
            <span className="text-xs text-muted-foreground">Cập nhật {formatDateTime(alertsQuery.updatedAt)}</span>
          )}
        </div>

        <DataState
          loading={alertsQuery.loading}
          error={alertsQuery.error}
          empty={!alertsQuery.loading && !alertsQuery.error && filtered.length === 0}
          emptyText="Không có cảnh báo phù hợp"
          onRetry={alertsQuery.refetch}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/50 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Cảnh báo</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Mức độ</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">IP</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Người xử lý</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((alert, index) => (
                  <motion.tr
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                    className="transition hover:bg-accent/30"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/alerts/${alert.id}`} className="font-semibold hover:text-primary">
                        {alert.title}
                      </Link>
                      <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">
                        {alert.description || alert.alert_type || 'Không có mô tả'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[alert.severity?.toLowerCase()] || 'border-border bg-accent text-muted-foreground'}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-danger">{alertIP(alert)}</td>
                    <td className="px-5 py-4 text-xs">{alert.assigned_name || 'Chưa giao'}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColor[alert.status?.toLowerCase()] || 'border-border bg-accent text-muted-foreground'}`}>
                        {statusLabel[alert.status?.toLowerCase()] || alert.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{formatDateTime(alert.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>

      {stats.total > 0 && stats.new === 0 && stats.processing === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle className="h-4 w-4" /> Không còn cảnh báo đang mở.
        </div>
      )}
    </div>
  );
}
