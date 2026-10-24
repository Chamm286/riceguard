'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, BookOpen, CheckCircle, Clock, ListChecks, Loader2,
  Play, RefreshCw, Target, X, Zap,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import api, { getApiErrorMessage } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/format';

interface PlaybookStep {
  step: number;
  action: string;
}

interface Playbook {
  id: number;
  name: string;
  description: string;
  category: string;
  severity: string;
  steps: PlaybookStep[];
  avg_time_minutes: number;
  run_count: number;
  success_rate: number;
}

interface PlaybookStats {
  total: number;
  totalRuns: number;
  critical: number;
}

const severityColor: Record<string, string> = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  critical: 'bg-danger/10 text-danger border-danger/30',
};

export default function PlaybooksPage() {
  const playbooksQuery = useApiData<Playbook[]>('/playbooks');
  const statsQuery = useApiData<PlaybookStats>('/playbooks/stats');
  const [runningId, setRunningId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Playbook | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const playbooks = playbooksQuery.data || [];
  const stats = statsQuery.data;
  const totalRuns = stats?.totalRuns ?? playbooks.reduce((sum, playbook) => sum + Number(playbook.run_count || 0), 0);
  const weightedSuccess = playbooks.length
    ? Math.round(
        playbooks.reduce((sum, playbook) => sum + Number(playbook.success_rate || 0) * Number(playbook.run_count || 0), 0) /
          Math.max(1, playbooks.reduce((sum, playbook) => sum + Number(playbook.run_count || 0), 0))
      )
    : 0;

  const refresh = () => {
    playbooksQuery.refetch();
    statsQuery.refetch();
  };

  const runPlaybook = async (playbook: Playbook) => {
    setRunningId(playbook.id);
    setNotice(null);
    try {
      const res = await api.post(`/playbooks/${playbook.id}/run`);
      setNotice({ type: 'success', text: res.data?.message || `Đã chạy ${playbook.name}` });
      setTimeout(refresh, 3500);
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbooks"
        description="Kịch bản xử lý sự cố và lịch sử thực thi"
        action={
          <button onClick={refresh} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
            <RefreshCw className={`h-4 w-4 ${playbooksQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Playbooks" value={formatNumber(stats?.total ?? playbooks.length)} icon={BookOpen} />
        <StatCard label="Tổng lần chạy" value={formatNumber(totalRuns)} icon={Zap} color="gradient-cyber" delay={0.05} />
        <StatCard label="Tỷ lệ thành công" value={formatPercent(weightedSuccess)} icon={CheckCircle} color="gradient-success" delay={0.1} />
        <StatCard label="Critical" value={formatNumber(stats?.critical ?? playbooks.filter((playbook) => playbook.severity === 'critical').length)} icon={AlertTriangle} color="gradient-danger" delay={0.15} />
      </div>

      {notice && (
        <div className={`rounded-2xl border p-4 text-sm ${notice.type === 'success' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
          {notice.text}
        </div>
      )}

      <DataState
        loading={playbooksQuery.loading}
        error={playbooksQuery.error}
        empty={!playbooksQuery.loading && !playbooksQuery.error && playbooks.length === 0}
        emptyText="Chưa có playbook"
        onRetry={refresh}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((playbook, index) => (
            <motion.div
              key={playbook.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
              className="hover-lift group rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary glow transition group-hover:scale-105">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[playbook.severity] || severityColor.medium}`}>
                  {playbook.severity}
                </span>
              </div>

              <h3 className="text-lg font-semibold">{playbook.name}</h3>
              <p className="mb-4 line-clamp-2 min-h-8 text-xs text-muted-foreground">{playbook.description || '—'}</p>

              <div className="mb-4 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="flex items-center gap-1 text-muted-foreground"><ListChecks className="h-3 w-3" />Steps</p>
                  <p className="mt-0.5 font-semibold">{Array.isArray(playbook.steps) ? playbook.steps.length : 0}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />Time</p>
                  <p className="mt-0.5 font-semibold">{playbook.avg_time_minutes || 0}p</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-muted-foreground"><Target className="h-3 w-3" />Success</p>
                  <p className="mt-0.5 font-semibold text-success">{formatPercent(playbook.success_rate)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <button onClick={() => setSelected(playbook)} className="text-[10px] text-muted-foreground hover:text-primary">
                  Chạy {formatNumber(playbook.run_count)} lần • Xem các bước
                </button>
                <button
                  onClick={() => runPlaybook(playbook)}
                  disabled={runningId === playbook.id}
                  className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-[10px] font-semibold text-white glow transition hover:opacity-90 disabled:opacity-50"
                >
                  {runningId === playbook.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Chạy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </DataState>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[80vh] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2">
              {(selected.steps || []).map((step) => (
                <div key={step.step} className="flex items-start gap-3 rounded-xl bg-accent/40 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-white">{step.step}</span>
                  <p className="text-sm">{step.action}</p>
                </div>
              ))}
              {(!selected.steps || selected.steps.length === 0) && <p className="text-sm text-muted-foreground">Chưa có bước nào.</p>}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
