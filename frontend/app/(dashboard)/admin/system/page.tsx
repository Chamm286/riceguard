'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, Cpu, Database, HardDrive,
  MemoryStick, RefreshCw, Server, Wifi, XCircle, Zap,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatBytes, formatDateTime, formatDuration, formatNumber } from '@/lib/format';

export interface ServiceStatus {
  id: string;
  name: string;
  port?: number;
  online: boolean;
  statusCode?: number | null;
  latencyMs?: number;
  error?: string;
}

export interface SystemStatus {
  timestamp: string;
  uptimeSeconds: number;
  runtime: { node: string; platform: string; arch: string; pid: number; timezone: string };
  system: {
    hostname: string;
    osUptimeSeconds: number;
    cpu: { cores: number; model: string; load1: number; load5: number; load15: number; usagePercent: number };
    memory: { totalBytes: number; usedBytes: number; freeBytes: number; usedPercent: number; processRssBytes: number };
    disk: { totalBytes: number; usedBytes: number; freeBytes: number; usedPercent: number };
  };
  database: { online: boolean; latencyMs: number; name?: string; version?: string; sizeBytes?: number; error?: string };
  counts: Record<string, number>;
  services: ServiceStatus[];
  integrations: { n8nApiConfigured: boolean; n8nUrl: string; aiUrl: string; frontendUrl: string; telegramConfigured: boolean };
}

export default function AdminSystemPage() {
  const { data, error, loading, refreshing, updatedAt, refetch } = useApiData<SystemStatus>('/system/status', {
    pollMs: 15000,
  });

  const counts = data?.counts || {};
  const services = useMemo(() => data?.services || [], [data?.services]);
  const system = data?.system;

  const healthScore = useMemo(() => {
    if (!services.length) return 0;
    return Math.round((services.filter((s) => s.online).length / services.length) * 100);
  }, [services]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trạng thái hệ thống"
        description="Dữ liệu thật từ Backend, PostgreSQL, n8n và AI service"
        action={
          <button
            onClick={refetch}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {updatedAt ? `Cập nhật ${formatDateTime(updatedAt)}` : 'Làm mới'}
          </button>
        }
      />

      <DataState loading={loading} error={error} onRetry={refetch}>
        {data && system && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="CPU load" value={`${system.cpu.usagePercent}%`} icon={Cpu} sub={`${system.cpu.cores} cores • ${system.cpu.load1}`} color={system.cpu.usagePercent > 80 ? 'gradient-danger' : 'gradient-primary'} />
              <StatCard label="RAM đã dùng" value={`${system.memory.usedPercent}%`} icon={MemoryStick} sub={`${formatBytes(system.memory.usedBytes)} / ${formatBytes(system.memory.totalBytes)}`} color={system.memory.usedPercent > 85 ? 'gradient-danger' : 'gradient-success'} delay={0.05} />
              <StatCard label="Ổ đĩa" value={`${system.disk.usedPercent}%`} icon={HardDrive} sub={`${formatBytes(system.disk.usedBytes)} / ${formatBytes(system.disk.totalBytes)}`} color={system.disk.usedPercent > 90 ? 'gradient-danger' : 'gradient-cyber'} delay={0.1} />
              <StatCard label="Dịch vụ online" value={`${services.filter((s) => s.online).length}/${services.length}`} icon={Wifi} sub={`Health score ${healthScore}%`} color={healthScore === 100 ? 'gradient-success' : 'gradient-warning'} delay={0.15} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card lg:col-span-2">
                <div className="flex items-center justify-between border-b border-border p-5">
                  <div>
                    <h3 className="font-semibold">Dịch vụ hệ thống</h3>
                    <p className="text-xs text-muted-foreground">Kiểm tra trực tiếp qua HTTP health check</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    Uptime {formatDuration(data.uptimeSeconds)}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${service.online ? 'bg-success/15' : 'bg-danger/15'}`}>
                          {service.online ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-danger" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{service.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {service.port ? `Port ${service.port}` : 'Internal'}
                            {service.latencyMs !== undefined ? ` • ${service.latencyMs} ms` : ''}
                            {service.statusCode ? ` • HTTP ${service.statusCode}` : ''}
                          </p>
                          {service.error && <p className="truncate text-[10px] text-danger">{service.error}</p>}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${service.online ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
                        {service.online ? 'Online' : 'Offline'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Database className="h-4 w-4 text-primary" />
                    PostgreSQL
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <InfoRow label="Trạng thái" value={data.database.online ? 'Connected' : 'Disconnected'} danger={!data.database.online} />
                    <InfoRow label="Database" value={data.database.name || '—'} />
                    <InfoRow label="Latency" value={`${data.database.latencyMs} ms`} />
                    <InfoRow label="Kích thước" value={formatBytes(data.database.sizeBytes)} />
                    <InfoRow label="Version" value={data.database.version || '—'} />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Server className="h-4 w-4 text-cyber" />
                    Runtime
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <InfoRow label="Hostname" value={system.hostname} />
                    <InfoRow label="Node.js" value={data.runtime.node} />
                    <InfoRow label="Platform" value={`${data.runtime.platform}/${data.runtime.arch}`} />
                    <InfoRow label="Timezone" value={data.runtime.timezone} />
                    <InfoRow label="OS uptime" value={formatDuration(system.osUptimeSeconds)} />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Cảnh báo', value: counts.alerts, icon: AlertTriangle, color: 'text-warning' },
                { label: 'Log hôm nay', value: counts.logs_today, icon: Activity, color: 'text-cyber' },
                { label: 'Báo cáo chờ', value: counts.reports_pending, icon: Server, color: 'text-primary' },
                { label: 'IP đã chặn', value: counts.blocked_ips, icon: XCircle, color: 'text-danger' },
                { label: 'Workflow chạy hôm nay', value: counts.workflow_runs_today, icon: Zap, color: 'text-success' },
                { label: 'Người dùng', value: counts.users, icon: Server, color: 'text-primary' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <p className="mt-2 text-2xl font-bold">{formatNumber(item.value || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                Tích hợp n8n
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoRow label="n8n URL" value={data.integrations.n8nUrl} />
                <InfoRow label="AI URL" value={data.integrations.aiUrl} />
                <InfoRow label="Điều khiển n8n API" value={data.integrations.n8nApiConfigured ? 'Đã cấu hình' : 'Chưa cấu hình N8N_API_KEY'} danger={!data.integrations.n8nApiConfigured} />
                <InfoRow label="Telegram" value={data.integrations.telegramConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'} danger={!data.integrations.telegramConfigured} />
              </div>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`max-w-[60%] break-all text-right font-mono text-xs ${danger ? 'text-danger' : ''}`}>{value}</span>
    </div>
  );
}
