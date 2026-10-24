'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Leaf, Loader2, RefreshCw, Search } from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { baseURL } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatDateTime, formatNumber } from '@/lib/format';

interface Report {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  ai_severity: string | null;
  ai_disease: string | null;
  status: string;
  user_name: string | null;
  created_at: string;
}

function severityKey(value: string | null) {
  const normalized = (value || '').toLowerCase().replace(/[*\s]/g, '');
  if (normalized.includes('cao')) return 'cao';
  if (normalized.includes('trungbinh')) return 'trung bình';
  if (normalized.includes('thap')) return 'thấp';
  return '';
}

function imageUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${baseURL.replace(/\/api$/, '')}${path}`;
}

export default function CyberFarmerReportsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const reportsQuery = useApiData<Report[]>('/reports', { pollMs: 30000 });
  const reports = useMemo(() => reportsQuery.data || [], [reportsQuery.data]);

  const stats = useMemo(() => ({
    total: reports.length,
    severe: reports.filter((report) => severityKey(report.ai_severity) === 'cao').length,
    pending: reports.filter((report) => report.status === 'pending').length,
    healthy: reports.filter((report) => !report.ai_disease || report.ai_disease.toLowerCase() === 'không có').length,
  }), [reports]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchSearch =
        !query ||
        report.title?.toLowerCase().includes(query) ||
        report.user_name?.toLowerCase().includes(query) ||
        report.ai_disease?.toLowerCase().includes(query);
      const matchFilter = filter === 'all' || severityKey(report.ai_severity) === filter;
      return matchSearch && matchFilter;
    });
  }, [reports, search, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo sức khỏe lúa"
        description="Dữ liệu báo cáo nông dân và kết quả AI từ PostgreSQL/n8n"
        action={
          <button onClick={reportsQuery.refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${reportsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng báo cáo" value={formatNumber(stats.total)} icon={Leaf} />
        <StatCard label="Bệnh nặng" value={formatNumber(stats.severe)} icon={AlertTriangle} color="gradient-danger" delay={0.05} />
        <StatCard label="Đang chờ AI" value={formatNumber(stats.pending)} icon={Loader2} color="gradient-warning" delay={0.1} />
        <StatCard label="Khỏe mạnh" value={formatNumber(stats.healthy)} icon={CheckCircle2} color="gradient-success" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề, tên nông dân hoặc bệnh..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Tất cả mức độ</option>
          <option value="cao">Mức độ cao</option>
          <option value="trung bình">Trung bình</option>
          <option value="thấp">Thấp</option>
        </select>
      </div>

      <DataState
        loading={reportsQuery.loading}
        error={reportsQuery.error}
        empty={!reportsQuery.loading && !reportsQuery.error && filtered.length === 0}
        emptyText="Không có báo cáo nào"
        onRetry={reportsQuery.refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report, index) => {
            const severity = severityKey(report.ai_severity);
            const image = imageUrl(report.image_url);
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
              >
                <div className="relative aspect-video bg-accent">
                  {image ? (
                    <img src={image} alt={report.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><Leaf className="h-8 w-8" /></div>
                  )}
                  {severity && (
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${
                      severity === 'cao' ? 'bg-danger text-white' : severity === 'trung bình' ? 'bg-warning text-white' : 'bg-success text-white'
                    }`}>{severity}</span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-1 text-sm font-semibold">{report.title}</h3>
                  <p className="text-xs text-muted-foreground">👤 {report.user_name || 'N/A'}</p>
                  {report.ai_disease && (
                    <p className="text-xs"><span className="text-muted-foreground">Bệnh:</span> <span className="font-semibold">{report.ai_disease}</span></p>
                  )}
                  <p className="border-t border-border pt-2 text-[10px] text-muted-foreground">{formatDateTime(report.created_at)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DataState>
    </div>
  );
}
