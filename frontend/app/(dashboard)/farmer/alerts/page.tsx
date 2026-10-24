'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle2, Clock, MapPin, RefreshCw, TrendingUp } from 'lucide-react';
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
  alert_type: string;
  status: string;
  created_at: string;
  field_name: string | null;
}

function severityStyle(severity: string) {
  const normalized = (severity || '').toLowerCase();
  if (normalized.includes('cao')) return { border: 'border-danger/50', badge: 'bg-danger/20 text-danger', gradient: 'gradient-danger' };
  if (normalized.includes('trung')) return { border: 'border-warning/50', badge: 'bg-warning/20 text-warning', gradient: 'gradient-warning' };
  return { border: 'border-border', badge: 'bg-primary/20 text-primary', gradient: 'gradient-primary' };
}

export default function FarmerAlertsPage() {
  const alertsQuery = useApiData<Alert[]>('/alerts/mine', { pollMs: 30000 });
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);

  const stats = useMemo(() => ({
    newAlerts: alerts.filter((alert) => alert.status === 'new').length,
    disease: alerts.filter((alert) => alert.alert_type === 'disease').length,
    resolved: alerts.filter((alert) => alert.status === 'resolved').length,
  }), [alerts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cảnh báo"
        description="Thông báo bệnh bùng phát và điều kiện thời tiết nguy hiểm"
        action={
          <button onClick={alertsQuery.refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${alertsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Cảnh báo mới" value={formatNumber(stats.newAlerts)} icon={AlertTriangle} color="gradient-danger" />
        <StatCard label="Cảnh báo bệnh" value={formatNumber(stats.disease)} icon={Bell} color="gradient-warning" delay={0.05} />
        <StatCard label="Đã xử lý" value={formatNumber(stats.resolved)} icon={CheckCircle2} color="gradient-success" delay={0.1} />
      </div>

      <DataState
        loading={alertsQuery.loading}
        error={alertsQuery.error}
        empty={!alertsQuery.loading && !alertsQuery.error && alerts.length === 0}
        emptyText="Chưa có cảnh báo nào"
        onRetry={alertsQuery.refetch}
      >
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const style = severityStyle(alert.severity);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className={`rounded-2xl border bg-card p-5 transition hover:border-primary/50 ${style.border}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.gradient}`}>
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{alert.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>{alert.severity}</span>
                      {alert.status === 'resolved' && <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">Đã xử lý</span>}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{alert.description || 'Không có mô tả'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {alert.field_name || 'Toàn khu vực'}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(alert.created_at)}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {alert.alert_type === 'disease' ? 'Bệnh cây' : 'Nông nghiệp'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DataState>
    </div>
  );
}
