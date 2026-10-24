'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, Clock, Filter, Fingerprint, RefreshCw, Search, Target, User,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatDateTime, formatNumber } from '@/lib/format';

interface Investigation {
  id: number;
  code: string;
  title: string;
  description: string;
  target: string;
  severity: string;
  status: string;
  progress: number;
  assigned_to: number | null;
  analyst_name: string | null;
  alert_title: string | null;
  started_at: string;
  resolved_at: string | null;
  resolution: string | null;
}

interface InvestigationStats {
  total: number;
  investigating: number;
  resolved: number;
  critical: number;
}

const severityColor: Record<string, string> = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  critical: 'bg-danger/10 text-danger border-danger/30',
};

export default function InvestigationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const { data, error, loading, refreshing, refetch } = useApiData<Investigation[]>('/investigations');
  const statsQuery = useApiData<InvestigationStats>('/investigations/stats');

  const investigations = useMemo(() => data || [], [data]);
  const stats = statsQuery.data;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return investigations.filter((item) => {
      const matchStatus = status === 'all' || item.status === status;
      const matchSeverity = severity === 'all' || item.severity === severity;
      const matchSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.target?.toLowerCase().includes(query) ||
        item.analyst_name?.toLowerCase().includes(query);
      return matchStatus && matchSeverity && matchSearch;
    });
  }, [investigations, search, status, severity]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điều tra sự cố"
        description="Theo dõi tiến độ điều tra và phân công analyst"
        action={
          <button onClick={() => { refetch(); statsQuery.refetch(); }} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng điều tra" value={formatNumber(stats?.total ?? investigations.length)} icon={Fingerprint} />
        <StatCard label="Đang điều tra" value={formatNumber(stats?.investigating ?? investigations.filter((item) => item.status === 'investigating').length)} icon={Clock} color="gradient-warning" delay={0.05} />
        <StatCard label="Đã xử lý" value={formatNumber(stats?.resolved ?? investigations.filter((item) => item.status === 'resolved').length)} icon={CheckCircle} color="gradient-success" delay={0.1} />
        <StatCard label="Critical" value={formatNumber(stats?.critical ?? investigations.filter((item) => item.severity === 'critical').length)} icon={Target} color="gradient-danger" delay={0.15} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã, tiêu đề, target, analyst..." className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 bg-transparent text-sm outline-none">
              <option value="all">Tất cả trạng thái</option>
              <option value="investigating">Đang điều tra</option>
              <option value="resolved">Đã xử lý</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3.5">
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-11 bg-transparent text-sm outline-none">
              <option value="all">Tất cả mức độ</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <span className="flex items-center rounded-xl bg-accent px-3 text-xs text-muted-foreground">{filtered.length} kết quả</span>
        </div>
      </div>

      <DataState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyText="Không có điều tra phù hợp" onRetry={refetch}>
        <div className="space-y-3">
          {filtered.map((investigation, index) => (
            <motion.div
              key={investigation.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="hover-lift flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${investigation.status === 'investigating' ? 'gradient-warning' : 'gradient-success'}`}>
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-64 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{investigation.code}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityColor[investigation.severity] || severityColor.medium}`}>{investigation.severity}</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] capitalize text-muted-foreground">{investigation.status}</span>
                </div>
                <p className="font-medium">{investigation.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateTime(investigation.started_at)}</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{investigation.analyst_name || 'Chưa phân công'}</span>
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />{investigation.target || '—'}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
                    <div className={`h-full ${investigation.progress >= 100 ? 'gradient-success' : 'gradient-warning'}`} style={{ width: `${Math.min(100, Number(investigation.progress) || 0)}%` }} />
                  </div>
                  <span className="w-8 text-right text-[10px] text-muted-foreground">{Number(investigation.progress) || 0}%</span>
                </div>
              </div>
              <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${investigation.status === 'resolved' ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
                {investigation.status === 'resolved' ? <CheckCircle className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                {investigation.status === 'resolved' ? 'Đã xử lý' : 'Đang điều tra'}
              </span>
            </motion.div>
          ))}
        </div>
      </DataState>
    </div>
  );
}
