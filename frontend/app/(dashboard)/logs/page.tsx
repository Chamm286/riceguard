'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Activity, Filter, Pause, Play, RefreshCw, Search, Terminal,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { formatNumber, formatTime } from '@/lib/format';
import { baseURL } from '@/lib/api';

interface LogRow {
  id: number | string;
  source: string;
  event_type: string;
  severity: string;
  ip_address: string | null;
  message: string;
  created_at: string;
  live?: boolean;
}

const socketUrl = baseURL.replace(/\/api$/, '');
const severityStyle: Record<string, string> = {
  critical: 'text-danger',
  high: 'text-orange-400',
  warning: 'text-warning',
  medium: 'text-warning',
  info: 'text-primary',
  low: 'text-success',
};

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [livePaused, setLivePaused] = useState(false);
  const [liveLogs, setLiveLogs] = useState<LogRow[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const pausedRef = useRef(livePaused);

  useEffect(() => {
    pausedRef.current = livePaused;
  }, [livePaused]);

  const { data, error, loading, refreshing, refetch } = useApiData<LogRow[]>('/logs', {
    params: { limit: 200 },
    pollMs: 15000,
  });

  useEffect(() => {
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on('new_log', (log: Partial<LogRow>) => {
      if (pausedRef.current) return;
      const row: LogRow = {
        id: `live-${Date.now()}-${Math.random()}`,
        source: log.source || 'filebeat',
        event_type: log.event_type || 'log',
        severity: log.severity || 'info',
        ip_address: log.ip_address || null,
        message: log.message || '',
        created_at: log.created_at || new Date().toISOString(),
        live: true,
      };
      setLiveLogs((current) => [row, ...current].slice(0, 200));
      setLiveCount((count) => count + 1);
    });
    socket.on('new_alert', () => setLiveCount((count) => count + 1));
    return () => { socket.disconnect(); };
  }, []);

  const combined = useMemo(() => {
    const seen = new Set<string>();
    return [...liveLogs, ...(data || [])].filter((log) => {
      const key = String(log.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [liveLogs, data]);

  const sources = useMemo(() => Array.from(new Set(combined.map((log) => log.source).filter(Boolean))).slice(0, 20), [combined]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return combined.filter((log) => {
      const matchSeverity = !severity || log.severity === severity;
      const matchSource = !source || log.source === source;
      const matchSearch =
        !query ||
        log.message?.toLowerCase().includes(query) ||
        log.ip_address?.toLowerCase().includes(query) ||
        log.event_type?.toLowerCase().includes(query);
      return matchSeverity && matchSource && matchSearch;
    });
  }, [combined, search, severity, source]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hệ thống"
        description={`${formatNumber(filtered.length)} log • Socket.IO realtime + REST fallback`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setLivePaused((value) => !value)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${livePaused ? 'border-warning/30 bg-warning/10 text-warning' : 'border-success/30 bg-success/10 text-success'}`}
            >
              {livePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {livePaused ? 'Tiếp tục live' : 'Tạm dừng live'}
            </button>
            <button onClick={refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm message, IP, event..." className="flex-1 bg-transparent font-mono text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-11 bg-transparent text-sm outline-none">
              <option value="">Mọi mức độ</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3.5">
            <select value={source} onChange={(event) => setSource(event.target.value)} className="h-11 bg-transparent text-sm outline-none">
              <option value="">Mọi nguồn</option>
              {sources.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <span className="flex items-center gap-2 rounded-xl bg-accent px-3 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${livePaused ? 'bg-warning' : 'bg-success animate-pulse'}`} />
            {livePaused ? 'Đã tạm dừng' : `${liveCount} live`}
          </span>
        </div>
      </div>

      <DataState loading={loading} error={error} empty={!loading && !error && filtered.length === 0} emptyText="Chưa có log" onRetry={refetch}>
        <div className="overflow-hidden rounded-2xl border border-border bg-[#08100c]">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Terminal className="h-4 w-4 text-primary" /> Live stream</div>
            <span className="font-mono text-[10px] text-muted-foreground">{filtered.length} dòng</span>
          </div>
          <div className="max-h-[620px] overflow-auto p-3 font-mono text-xs">
            {filtered.map((log) => (
              <div key={log.id} className="flex gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <span className="shrink-0 text-muted-foreground">{formatTime(log.created_at)}</span>
                <span className={`w-16 shrink-0 uppercase ${severityStyle[log.severity] || 'text-muted-foreground'}`}>{log.severity}</span>
                <span className="w-24 shrink-0 truncate text-cyber">{log.source}</span>
                <span className="w-32 shrink-0 truncate text-warning">{log.event_type}</span>
                <span className="w-32 shrink-0 truncate text-muted-foreground">{log.ip_address || '—'}</span>
                <span className="min-w-0 flex-1 break-all text-foreground/90">{log.message}</span>
                {log.live && <span className="shrink-0 rounded bg-primary/20 px-1 text-[9px] text-primary">LIVE</span>}
              </div>
            ))}
          </div>
        </div>
      </DataState>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-primary" /> Socket: {socketUrl}</span>
        <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> REST refresh 15s</span>
      </div>
    </div>
  );
}
