'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle, Cpu, Database, HardDrive, LucideIcon,
  MapPin, RefreshCw, Server, Shield, Wifi,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatNumber } from '@/lib/format';

interface Asset {
  id: number;
  name: string;
  asset_type: string;
  ip_address: string | null;
  os: string | null;
  status: string;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  uptime_days: number;
  field_name: string | null;
}

interface AssetStats {
  total: number;
  online: number;
  warning: number;
  offline: number;
}

const typeIcon: Record<string, LucideIcon> = {
  server: Server,
  database: Database,
  'iot sensor': Wifi,
  iot: Wifi,
  service: Cpu,
};

const typeColor: Record<string, string> = {
  server: 'gradient-primary',
  database: 'gradient-cyber',
  'iot sensor': 'gradient-success',
  iot: 'gradient-success',
  service: 'gradient-warning',
};

function typeLabel(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Khác';
}

export default function AssetsPage() {
  const [type, setType] = useState('all');
  const { data, error, loading, refreshing, refetch } = useApiData<Asset[]>('/assets');
  const statsQuery = useApiData<AssetStats>('/assets/stats');
  const assets = useMemo(() => data || [], [data]);
  const stats = statsQuery.data;

  const types = useMemo(() => Array.from(new Set(assets.map((asset) => asset.asset_type))), [assets]);
  const filtered = useMemo(
    () => (type === 'all' ? assets : assets.filter((asset) => asset.asset_type === type)),
    [assets, type]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài sản"
        description="Server, database, IoT sensor và service trong hệ thống"
        action={
          <div className="flex gap-2">
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3.5 text-sm outline-none">
              <option value="all">Tất cả loại</option>
              {types.map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}
            </select>
            <button onClick={() => { refetch(); statsQuery.refetch(); }} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng tài sản" value={formatNumber(stats?.total ?? assets.length)} icon={Server} />
        <StatCard label="Online" value={formatNumber(stats?.online ?? assets.filter((asset) => asset.status === 'online').length)} icon={CheckCircle} color="gradient-success" delay={0.05} />
        <StatCard label="Cảnh báo" value={formatNumber(stats?.warning ?? assets.filter((asset) => asset.status === 'warning').length)} icon={AlertTriangle} color="gradient-warning" delay={0.1} />
        <StatCard label="Offline" value={formatNumber(stats?.offline ?? assets.filter((asset) => asset.status === 'offline').length)} icon={Activity} color="gradient-danger" delay={0.15} />
      </div>

      <DataState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyText="Chưa có tài sản" onRetry={refetch}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset, index) => {
            const typeKey = (asset.asset_type || '').toLowerCase();
            const Icon = typeIcon[typeKey] || Server;
            const color = typeColor[typeKey] || 'gradient-primary';
            const metrics = [
              { label: 'CPU', value: Number(asset.cpu_usage) || 0, color: 'bg-primary' },
              { label: 'RAM', value: Number(asset.ram_usage) || 0, color: 'bg-cyber' },
              { label: 'Disk', value: Number(asset.disk_usage) || 0, color: 'bg-success' },
            ];
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="hover-lift rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                    asset.status === 'online' ? 'border-success/30 bg-success/10 text-success' :
                    asset.status === 'warning' ? 'border-warning/30 bg-warning/10 text-warning' :
                    'border-danger/30 bg-danger/10 text-danger'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${asset.status === 'online' ? 'bg-success animate-pulse' : asset.status === 'warning' ? 'bg-warning animate-pulse' : 'bg-danger'}`} />
                    {asset.status}
                  </span>
                </div>

                <h3 className="font-semibold">{asset.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{typeLabel(asset.asset_type)} • {asset.os || 'Unknown OS'}</p>
                <p className="mt-1 font-mono text-xs text-primary">{asset.ip_address || '—'}</p>
                {asset.field_name && <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{asset.field_name}</p>}

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {metrics.map((metric) => {
                    const value = Math.max(0, Math.min(100, metric.value));
                    return (
                      <div key={metric.label}>
                        <div className="mb-1 flex justify-between text-[10px]">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-accent">
                          <div className={`h-full ${value > 80 ? 'bg-danger' : value > 50 ? 'bg-warning' : metric.color}`} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{asset.uptime_days || 0} ngày</span>
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" />{asset.status === 'online' ? 'Secure' : 'Cần kiểm tra'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DataState>
    </div>
  );
}
