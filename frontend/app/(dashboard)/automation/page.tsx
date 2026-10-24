'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, CheckCircle, Clock, FileBarChart, History, Info, Leaf, Loader2,
  Pause, Play, Power, Radio, RefreshCw, Satellite, ShieldAlert, Users, Workflow,
  X, XCircle, Zap,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import api, { getApiErrorMessage } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatDateTime, formatNumber, formatPercent, formatRelative } from '@/lib/format';

interface WorkflowItem {
  id: number;
  workflow_id: string;
  slug: string;
  name: string;
  description: string;
  owner: string;
  trigger_type: string;
  status: string;
  last_run: string | null;
  execution_count: number;
  success_rate: number;
  failed_runs: number;
  runs_today: number;
}

interface WorkflowStats {
  total: number;
  active: number;
  paused: number;
  errors: number;
  totalExecutions: number;
  runsToday: number;
  successRate: number;
  liveControl: boolean;
}

interface WorkflowLog {
  id: number;
  workflow_id: string;
  status: string;
  execution_count: number | null;
  message: string;
  created_at: string;
}

const statusStyle: Record<string, string> = {
  active: 'border-success/30 bg-success/10 text-success',
  paused: 'border-warning/30 bg-warning/10 text-warning',
  error: 'border-danger/30 bg-danger/10 text-danger',
};

const statusLabel: Record<string, string> = {
  active: 'Đang chạy',
  paused: 'Tạm dừng',
  error: 'Lỗi',
};

const ownerColor: Record<string, string> = {
  'Bích Trâm': 'gradient-primary',
  'Tống Mỹ Trà': 'gradient-cyber',
  'Trần Anh Tuấn': 'gradient-success',
  'Hữu Thuận': 'gradient-warning',
};

const workflowLabels: Record<string, string> = {
  'soc-alert-triage': 'SOC Alert Triage',
  'rice-disease-diagnosis': 'Chẩn đoán bệnh lúa',
  'sentinel-2-sync': 'Đồng bộ Sentinel-2',
  'daily-security-report': 'Báo cáo bảo mật hàng ngày',
};

const workflowIcons = {
  'soc-alert-triage': ShieldAlert,
  'rice-disease-diagnosis': Leaf,
  'sentinel-2-sync': Satellite,
  'daily-security-report': FileBarChart,
};

export default function AutomationPage() {
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [selected, setSelected] = useState<WorkflowItem | null>(null);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const workflowsQuery = useApiData<WorkflowItem[]>('/workflows', {
    params: filter === 'all' ? {} : { status: filter },
    pollMs: 30000,
  });
  const statsQuery = useApiData<WorkflowStats>('/workflows/stats', { pollMs: 30000 });

  const workflows = useMemo(() => workflowsQuery.data || [], [workflowsQuery.data]);
  const stats = statsQuery.data;
  const liveControl = Boolean(stats?.liveControl);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const refresh = () => {
    workflowsQuery.refetch();
    statsQuery.refetch();
  };

  const handleRun = async (workflow: WorkflowItem) => {
    setActionId(workflow.id);
    setNotice(null);
    try {
      const res = await api.post(`/workflows/${workflow.id}/run`);
      setNotice({ type: 'ok', text: res.data?.message || 'Đã gửi yêu cầu chạy workflow' });
      setTimeout(refresh, 3000);
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  const handleToggle = async (workflow: WorkflowItem) => {
    setActionId(workflow.id);
    setNotice(null);
    try {
      const res = await api.post(`/workflows/${workflow.id}/toggle`);
      setNotice({ type: 'ok', text: res.data?.message || 'Đã cập nhật trạng thái workflow' });
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  const openLogs = async (workflow: WorkflowItem) => {
    setSelected(workflow);
    setLogs([]);
    setLogsLoading(true);
    try {
      const res = await api.get(`/workflows/${workflow.id}/logs`, { params: { limit: 30 } });
      setLogs(res.data?.data || []);
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setLogsLoading(false);
    }
  };

  const counts = useMemo(() => ({
    total: stats?.total ?? workflows.length,
    active: stats?.active ?? workflows.filter((item) => item.status === 'active').length,
    paused: stats?.paused ?? workflows.filter((item) => item.status === 'paused').length,
    errors: stats?.errors ?? workflows.filter((item) => item.status === 'error').length,
  }), [stats, workflows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tự động hóa n8n"
        description="Theo dõi 4 luồng workflow và lịch sử thực thi từ workflow_logs"
        action={
          <button onClick={refresh} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${workflowsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      {!statsQuery.loading && !liveControl && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Chưa bật điều khiển trực tiếp</p>
            <p className="mt-0.5 text-xs opacity-90">Backend chưa có <code className="font-mono">N8N_API_KEY</code>. Dữ liệu thống kê vẫn lấy thật từ <code className="font-mono">workflow_logs</code>; nút bật/tắt sẽ trả lỗi cho đến khi cấu hình key.</p>
          </div>
        </div>
      )}

      {notice && (
        <div className={`rounded-xl border p-3 text-sm ${notice.type === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng luồng" value={formatNumber(counts.total)} icon={Workflow} />
        <StatCard label="Đang chạy" value={formatNumber(counts.active)} icon={CheckCircle} color="gradient-success" delay={0.05} />
        <StatCard label="Tạm dừng" value={formatNumber(counts.paused)} icon={Pause} color="gradient-warning" delay={0.1} />
        <StatCard label="Lỗi" value={formatNumber(counts.errors)} icon={XCircle} color="gradient-danger" delay={0.15} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-semibold">{formatNumber(stats?.totalExecutions)}</span>
          <span className="text-muted-foreground">lần thực thi</span>
        </div>
        <span className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">Hôm nay: <b className="text-foreground">{formatNumber(stats?.runsToday)}</b></span>
        <span className="text-xs text-muted-foreground">Tỉ lệ thành công: <b className={Number(stats?.successRate) >= 95 ? 'text-success' : 'text-warning'}>{formatPercent(stats?.successRate, 1)}</b></span>
        <div className="ml-auto flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'active', label: 'Đang chạy' },
            { id: 'paused', label: 'Tạm dừng' },
            { id: 'error', label: 'Lỗi' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                filter === item.id ? 'gradient-primary text-white glow' : 'border border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <DataState loading={workflowsQuery.loading} error={workflowsQuery.error} empty={!workflowsQuery.loading && !workflowsQuery.error && workflows.length === 0} emptyText="Không có workflow" onRetry={workflowsQuery.refetch}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow, index) => {
            const Icon = workflowIcons[workflow.slug as keyof typeof workflowIcons] || Zap;
            return (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className="hover-lift flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ownerColor[workflow.owner] || 'gradient-primary'} glow`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">WF-{String(workflow.id).padStart(2, '0')}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[workflow.status] || 'border-border bg-accent text-muted-foreground'}`}>
                      {statusLabel[workflow.status] || workflow.status}
                    </span>
                  </div>
                  <h4 className="truncate font-semibold">{workflowLabels[workflow.slug] || workflow.name}</h4>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{workflow.slug}</p>
                </div>
              </div>

              <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">{workflow.description || 'Không có mô tả'}</p>

              <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Kích hoạt</p>
                  <p className="mt-0.5 flex items-center gap-1 font-medium"><Radio className="h-3 w-3 text-primary" />{workflow.trigger_type || 'webhook'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phụ trách</p>
                  <p className="mt-0.5 flex items-center gap-1 font-medium"><Users className="h-3 w-3" />{workflow.owner || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lần chạy</p>
                  <p className="mt-0.5 font-medium">{formatNumber(workflow.execution_count)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Thành công</p>
                  <p className={`mt-0.5 font-medium ${Number(workflow.success_rate) >= 99 ? 'text-success' : Number(workflow.success_rate) >= 95 ? 'text-warning' : 'text-danger'}`}>
                    {formatPercent(workflow.success_rate, 1)}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground" title={formatDateTime(workflow.last_run)}>
                  <Clock className="h-3 w-3" />{formatRelative(workflow.last_run)}
                </p>
                <div className="flex items-center gap-1">
                  {workflow.failed_runs > 0 && <span className="mr-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] text-danger">{workflow.failed_runs} lỗi</span>}
                  <button onClick={() => openLogs(workflow)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary" title="Lịch sử chạy">
                    <History className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRun(workflow)}
                    disabled={actionId === workflow.id || workflow.slug === 'soc-alert-triage'}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    title={workflow.slug === 'soc-alert-triage' ? 'SOC tự chạy khi có sự kiện bảo mật' : 'Chạy thử workflow'}
                  >
                    {actionId === workflow.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleToggle(workflow)}
                    disabled={actionId === workflow.id}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50 ${workflow.status === 'active' ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`}
                    title={workflow.status === 'active' ? 'Tạm dừng' : 'Bật'}
                  >
                    {actionId === workflow.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : workflow.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </DataState>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={(event) => event.stopPropagation()} className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-semibold">{workflowLabels[selected.slug] || selected.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{selected.slug} • 30 lần chạy gần nhất</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
              </div>
              <div className="overflow-auto p-5">
                {logsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Đang tải log...</div>
                ) : logs.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">Chưa có log thực thi</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
                        <span className={`mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          log.status === 'success' ? 'border-success/30 bg-success/10 text-success' :
                          log.status === 'failed' || log.status === 'error' ? 'border-danger/30 bg-danger/10 text-danger' :
                          'border-border bg-accent text-muted-foreground'
                        }`}>{log.status}</span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-xs">{log.message || 'Không có thông điệp'}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(log.created_at)}{log.execution_count ? ` • ${log.execution_count} bản ghi` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
