'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Cloud, Droplets, Leaf, Thermometer, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useApiData } from '@/hooks/use-api-data';
import { useAuth } from '@/hooks/use-auth';
import { DataState } from '@/components/common/data-state';
import { StatCard } from '@/components/common/stat-card';
import { formatNumber } from '@/lib/format';

interface Report {
  id: number;
  ai_severity: string | null;
  ai_disease: string | null;
}

interface Alert {
  id: number;
  severity: string;
  status: string;
}

interface Weather {
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    weather: string;
  };
  daily: Array<{ rainProbability: number; rain: number }>;
}

function severityKey(value: string | null) {
  const normalized = (value || '').toLowerCase().replace(/[*\s]/g, '');
  if (normalized.includes('cao')) return 'cao';
  if (normalized.includes('trungbinh')) return 'trung bình';
  return '';
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const reportsQuery = useApiData<Report[]>('/reports', { pollMs: 30000 });
  const alertsQuery = useApiData<Alert[]>('/alerts/mine', { pollMs: 30000 });
  const weatherQuery = useApiData<Weather>('/weather', { pollMs: 600000 });

  const reports = useMemo(() => reportsQuery.data || [], [reportsQuery.data]);
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);
  const weather = weatherQuery.data;

  const stats = useMemo(() => ({
    total: reports.length,
    severe: reports.filter((report) => severityKey(report.ai_severity) === 'cao').length,
    healthy: reports.filter((report) => !report.ai_disease || report.ai_disease.toLowerCase() === 'không có').length,
    openAlerts: alerts.filter((alert) => alert.status === 'new' || alert.status === 'processing').length,
  }), [reports, alerts]);

  const loading = reportsQuery.loading || alertsQuery.loading;
  const error = reportsQuery.error || alertsQuery.error;
  const refetch = () => {
    reportsQuery.refetch();
    alertsQuery.refetch();
    weatherQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Xin chào</p>
          <h1 className="mt-2 text-3xl font-bold">{user?.full_name || user?.username || 'Nông dân'} 👋</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Hệ thống cảnh báo sớm dịch bệnh cây lúa — dữ liệu báo cáo, cảnh báo và thời tiết lấy trực tiếp từ backend.
          </p>
          <Link href="/farmer/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg glow hover:opacity-90">
            <Leaf className="h-4 w-4" /> Gửi báo cáo mới <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {weatherQuery.error && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Không tải được thời tiết: {weatherQuery.error}
        </div>
      )}

      <DataState loading={loading} error={error} onRetry={refetch}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Tổng báo cáo" value={formatNumber(stats.total)} icon={Leaf} />
            <StatCard label="Bệnh nặng" value={formatNumber(stats.severe)} icon={AlertTriangle} color="gradient-danger" delay={0.05} />
            <StatCard label="Khỏe mạnh" value={formatNumber(stats.healthy)} icon={TrendingUp} color="gradient-success" delay={0.1} />
            <StatCard label="Cảnh báo mở" value={formatNumber(stats.openAlerts)} icon={Cloud} color="gradient-cyber" delay={0.15} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <WeatherCard icon={Thermometer} label="Nhiệt độ" value={weather ? `${weather.current.temperature}°C` : '—'} sub={weather?.current.weather || 'Đang tải...'} color="text-danger" />
            <WeatherCard icon={Droplets} label="Độ ẩm" value={weather ? `${weather.current.humidity}%` : '—'} sub="Dữ liệu Open-Meteo" color="text-warning" />
            <WeatherCard icon={Cloud} label="Mưa 24h" value={weather ? `${weather.daily?.[0]?.rainProbability ?? 0}%` : '—'} sub={weather ? `${weather.current.precipitation} mm hiện tại` : 'Đang tải...'} color="text-cyber" />
          </div>
        </div>
      </DataState>
    </div>
  );
}

function WeatherCard({ icon: Icon, label, value, sub, color }: { icon: typeof Thermometer; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
