'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, FileText, Leaf, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
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

export default function MyReportsPage() {
  const reportsQuery = useApiData<Report[]>('/reports', { pollMs: 30000 });
  const reports = useMemo(() => reportsQuery.data || [], [reportsQuery.data]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((report) => report.status === 'pending').length,
    reviewing: reports.filter((report) => report.status === 'reviewing').length,
    severe: reports.filter((report) => severityKey(report.ai_severity) === 'cao').length,
  }), [reports]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo của tôi"
        description="Lịch sử báo cáo sức khỏe lúa đã gửi"
        action={
          <button onClick={reportsQuery.refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${reportsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng báo cáo" value={formatNumber(stats.total)} icon={FileText} />
        <StatCard label="Đang chờ AI" value={formatNumber(stats.pending)} icon={Clock} color="gradient-warning" delay={0.05} />
        <StatCard label="Đang xử lý" value={formatNumber(stats.reviewing)} icon={Loader2} color="gradient-cyber" delay={0.1} />
        <StatCard label="Bệnh nặng" value={formatNumber(stats.severe)} icon={AlertTriangle} color="gradient-danger" delay={0.15} />
      </div>

      <DataState
        loading={reportsQuery.loading}
        error={reportsQuery.error}
        empty={!reportsQuery.loading && !reportsQuery.error && reports.length === 0}
        emptyText="Chưa có báo cáo nào"
        onRetry={reportsQuery.refetch}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {reports.map((report, index) => {
            const image = imageUrl(report.image_url);
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
              >
                <div className="relative aspect-video overflow-hidden bg-accent">
                  {image ? (
                    <img src={image} alt={report.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><Leaf className="h-8 w-8" /></div>
                  )}
                  <div className="absolute left-2 top-2"><StatusBadge status={report.status} /></div>
                  {severityKey(report.ai_severity) && (
                    <div className="absolute right-2 top-2"><SeverityBadge level={severityKey(report.ai_severity)} /></div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-1 text-sm font-semibold">{report.title}</h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{report.description || 'Không có mô tả'}</p>
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

      {!reportsQuery.loading && !reportsQuery.error && reports.length === 0 && (
        <div className="text-center">
          <Link href="/farmer/upload" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg glow">
            <Leaf className="h-4 w-4" /> Tạo báo cáo mới
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
    pending: { label: 'Chờ AI', icon: Clock, cls: 'bg-warning/90 text-white' },
    reviewing: { label: 'Đang xử lý', icon: Loader2, cls: 'bg-primary/90 text-white' },
    resolved: { label: 'Hoàn tất', icon: CheckCircle2, cls: 'bg-success/90 text-white' },
  };
  const item = map[status] || map.pending;
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold backdrop-blur ${item.cls}`}>
      <Icon className="h-3 w-3" /> {item.label}
    </span>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    'cao': 'bg-danger text-white',
    'trung bình': 'bg-warning text-white',
    'thấp': 'bg-success text-white',
  };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase backdrop-blur ${map[level] || 'bg-muted text-foreground'}`}>{level}</span>;
}
