'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, Ban, Eye, Globe, Loader2, RefreshCw, Search,
  ShieldAlert, Zap,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import api, { getApiErrorMessage } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatDateTime, formatNumber } from '@/lib/format';

interface Threat {
  id: number;
  ip_address: string;
  country: string | null;
  threat_type: string | null;
  severity: string;
  hits: number;
  status: string;
  last_seen: string;
  blocked_at: string | null;
}

interface ThreatStats {
  total: number;
  blocked: number;
  watching: number;
  critical: number;
}

const severityColor: Record<string, string> = {
  low: 'border-success/30 bg-success/10 text-success',
  medium: 'border-warning/30 bg-warning/10 text-warning',
  high: 'border-orange-500/30 bg-orange-500/10 text-orange-500',
  critical: 'border-danger/30 bg-danger/10 text-danger',
};

const severityLabels: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Nghiêm trọng',
};

function normalizeSeverity(value?: string) {
  return (value || 'low').toLowerCase();
}

function threatLabel(type?: string | null) {
  if (!type) return 'Không xác định';
  const labels: Record<string, string> = {
    sql_injection: 'SQL Injection',
    xss: 'XSS',
    path_traversal: 'Path Traversal',
    command_injection: 'Command Injection',
    brute_force: 'Brute Force',
    port_scan: 'Port Scan',
  };
  return labels[type] || type.replace(/_/g, ' ');
}

function locationLabel(ip?: string | null, country?: string | null) {
  const value = ip || '';
  if (value === '::1' || value.startsWith('127.') || value.startsWith('10.') || value.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(value)) {
    return 'Nội bộ';
  }
  return country || 'Không rõ';
}

export default function ThreatsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const threatsQuery = useApiData<Threat[]>('/threats', { pollMs: 20000 });
  const statsQuery = useApiData<ThreatStats>('/threats/stats', { pollMs: 20000 });
  const threats = useMemo(() => threatsQuery.data || [], [threatsQuery.data]);
  const stats = statsQuery.data;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threats.filter((threat) => {
      const matchStatus = filter === 'all' || threat.status === filter;
      const matchSearch =
        !query ||
        threat.ip_address?.toLowerCase().includes(query) ||
        threat.threat_type?.toLowerCase().includes(query) ||
        threat.country?.toLowerCase().includes(query) ||
        threat.severity?.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [threats, search, filter]);

  const refresh = () => {
    threatsQuery.refetch();
    statsQuery.refetch();
  };

  const updateThreat = async (threat: Threat, action: 'block' | 'watch') => {
    setActionId(threat.id);
    setNotice(null);
    try {
      const res = await api.post(`/threats/${threat.id}/${action}`);
      setNotice({ type: 'ok', text: res.data?.message || `Đã cập nhật ${threat.ip_address}` });
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mối đe dọa"
        description="IP tấn công, mức độ và trạng thái block từ database"
        action={
          <button onClick={refresh} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${threatsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      {notice && (
        <div className={`rounded-xl border p-3 text-sm ${notice.type === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng mối đe dọa" value={formatNumber(stats?.total ?? threats.length)} icon={AlertTriangle} />
        <StatCard label="Đã block" value={formatNumber(stats?.blocked ?? threats.filter((item) => item.status === 'blocked').length)} icon={Ban} color="gradient-danger" delay={0.05} />
        <StatCard label="Đang theo dõi" value={formatNumber(stats?.watching ?? threats.filter((item) => item.status === 'watching').length)} icon={Eye} color="gradient-warning" delay={0.1} />
        <StatCard label="Nguy hiểm" value={formatNumber(stats?.critical ?? threats.filter((item) => normalizeSeverity(item.severity) === 'critical').length)} icon={Zap} color="gradient-cyber" delay={0.15} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5 focus-within:border-primary/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm IP, quốc gia, loại tấn công..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50">
          <option value="all">Tất cả trạng thái</option>
          <option value="blocked">Đã block</option>
          <option value="watching">Đang theo dõi</option>
        </select>
        <span className="flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[10px] font-semibold text-danger">
          <Activity className="h-3 w-3 animate-pulse" /> LIVE 20s
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-danger" />Mối đe dọa đang hoạt động</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} kết quả</p>
          </div>
        </div>
        <DataState loading={threatsQuery.loading} error={threatsQuery.error} empty={!threatsQuery.loading && !threatsQuery.error && filtered.length === 0} emptyText="Không có mối đe dọa" onRetry={refresh}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/50 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">IP Address</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Quốc gia</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Loại tấn công</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Mức độ</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Số lần</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Lần cuối</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((threat, index) => (
                  <motion.tr key={threat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index * 0.03, 0.3) }} className="transition hover:bg-accent/30">
                    <td className="px-5 py-4 font-mono text-xs">{threat.ip_address}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{locationLabel(threat.ip_address, threat.country)}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium">{threatLabel(threat.threat_type)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[normalizeSeverity(threat.severity)] || 'border-border bg-accent text-muted-foreground'}`}>{severityLabels[normalizeSeverity(threat.severity)] || threat.severity}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm">{formatNumber(threat.hits)}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{formatDateTime(threat.last_seen)}</td>
                    <td className="px-5 py-4">
                      {threat.status === 'blocked' ? (
                        <span className="flex w-fit items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-[10px] font-semibold text-danger"><Ban className="h-3 w-3" />Blocked</span>
                      ) : (
                        <span className="flex w-fit items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[10px] font-semibold text-warning"><Eye className="h-3 w-3" />Watching</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {threat.status !== 'blocked' ? (
                        <button onClick={() => updateThreat(threat, 'block')} disabled={actionId === threat.id} className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1 text-[10px] font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50">
                          {actionId === threat.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />} Block
                        </button>
                      ) : (
                        <button onClick={() => updateThreat(threat, 'watch')} disabled={actionId === threat.id} className="flex items-center gap-1 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning transition hover:bg-warning/20 disabled:opacity-50">
                          {actionId === threat.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />} Watch
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>
    </div>
  );
}
