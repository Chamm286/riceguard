'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, CheckCircle, Clock, Download, FileBarChart, FileText,
  Filter, Leaf, RefreshCw, Search, ShieldAlert, TrendingUp,
} from 'lucide-react';
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
  ai_analysis: string | null;
  ai_severity: string | null;
  ai_disease: string | null;
  status: string;
  user_name?: string;
  field_id?: number | null;
  created_at: string;
}

const apiOrigin = baseURL.replace(/\/api$/, '');

function fileUrl(path: string) {
  return path.startsWith('http') ? path : `${apiOrigin}${path}`;
}

const statusStyle: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  reviewing: 'bg-cyber/10 text-cyber border-cyber/30',
  reviewed: 'bg-success/10 text-success border-success/30',
  resolved: 'bg-success/10 text-success border-success/30',
};

const statusLabel: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  reviewed: 'Đã duyệt',
  resolved: 'Đã xử lý',
};

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, error, loading, refreshing, refetch } = useApiData<Report[]>('/reports');

  const reports = useMemo(() => data || [], [data]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchStatus = status === 'all' || report.status === status;
      const matchSearch =
        !query ||
        report.title?.toLowerCase().includes(query) ||
        report.user_name?.toLowerCase().includes(query) ||
        report.ai_disease?.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [reports, search, status]);

  const stats = {
    total: reports.length,
    pending: reports.filter((report) => report.status === 'pending').length,
    reviewing: reports.filter((report) => report.status === 'reviewing').length,
    severe: reports.filter((report) => /cao|high|critical/i.test(report.ai_severity || '')).length,
  };

  const exportCsv = () => {
    const rows = [
      ['id', 'title', 'status', 'user_name', 'ai_disease', 'ai_severity', 'created_at'],
      ...filtered.map((report) => [report.id, report.title, report.status, report.user_name || '', report.ai_disease || '', report.ai_severity || '', report.created_at]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riceguard-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo & Thống kê"
        description="Báo cáo nông dân và kết quả phân tích AI từ database"
        action={
          <div className="flex gap-2">
            <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent transition">
              <Download className="h-4 w-4" /> Xuất CSV
            </button>
            <button onClick={refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng báo cáo" value={formatNumber(stats.total)} icon={FileBarChart} />
        <StatCard label="Chờ xử lý" value={formatNumber(stats.pending)} icon={Clock} color="gradient-warning" delay={0.05} />
        <StatCard label="Đang xem xét" value={formatNumber(stats.reviewing)} icon={Leaf} color="gradient-cyber" delay={0.1} />
        <StatCard label="AI cảnh báo cao" value={formatNumber(stats.severe)} icon={ShieldAlert} color="gradient-danger" delay={0.15} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm báo cáo, người gửi, bệnh..." className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 bg-transparent text-sm outline-none">
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="reviewing">Đang xem xét</option>
              <option value="reviewed">Đã duyệt</option>
            </select>
          </div>
          <span className="flex items-center rounded-xl bg-accent px-3 text-xs text-muted-foreground">{filtered.length} báo cáo</span>
        </div>
      </div>

      <DataState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyText="Chưa có báo cáo phù hợp" onRetry={refetch}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h3 className="font-semibold">Danh sách báo cáo</h3>
            <p className="text-xs text-muted-foreground">Dữ liệu từ bảng reports, cập nhật khi n8n/AI ghi kết quả</p>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
                className="flex flex-wrap items-center gap-4 p-4 hover:bg-accent/30 transition"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-52 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{report.title || `Báo cáo #${report.id}`}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[report.status] || 'border-border bg-accent text-muted-foreground'}`}>
                      {statusLabel[report.status] || report.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateTime(report.created_at)}</span>
                    <span>{report.user_name || `User #${report.id}`}</span>
                    {report.ai_disease && <span className="flex items-center gap-1"><Leaf className="h-3 w-3" />{report.ai_disease}</span>}
                    {report.ai_severity && (
                      <span className={`rounded-full px-2 py-0.5 ${/cao|high|critical/i.test(report.ai_severity) ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        AI: {report.ai_severity}
                      </span>
                    )}
                  </div>
                  {report.description && <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{report.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {report.image_url && (
                    <a href={fileUrl(report.image_url)} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
                      Ảnh
                    </a>
                  )}
                  <span className="rounded-lg bg-accent px-3 py-2 font-mono text-xs text-muted-foreground">#{report.id}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </DataState>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> Dữ liệu đồng bộ từ API /reports</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Kết quả AI hiển thị khi n8n cập nhật</span>
        </div>
      </div>
    </div>
  );
}
