'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, CheckSquare, Database, FileText, Lock, LucideIcon,
  RefreshCw, Shield, XCircle,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatNumber, formatPercent } from '@/lib/format';

interface ComplianceItem {
  id: number;
  name: string;
  status: string;
}

interface ComplianceGroup {
  framework: string;
  category: string;
  items: ComplianceItem[];
}

interface FrameworkStat {
  framework: string;
  total: string;
  passed: string;
}

interface ComplianceStats {
  total: number;
  passed: number;
  warning: number;
  failed: number;
  progress: number;
}

const statusIcon: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  passed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
};

const frameworkMeta: Record<string, { color: string; icon: LucideIcon }> = {
  'ISO 27001': { color: 'gradient-primary', icon: Shield },
  GDPR: { color: 'gradient-cyber', icon: Lock },
  'SOC 2': { color: 'gradient-warning', icon: FileText },
  NIST: { color: 'gradient-success', icon: Database },
};

export default function CompliancePage() {
  const groupsQuery = useApiData<ComplianceGroup[]>('/compliance');
  const statsQuery = useApiData<ComplianceStats>('/compliance/stats');
  const frameworkQuery = useApiData<FrameworkStat[]>('/compliance/by-framework');
  const [selectedFramework, setSelectedFramework] = useState('all');

  const groups = useMemo(() => groupsQuery.data || [], [groupsQuery.data]);
  const stats = statsQuery.data;
  const frameworkStats = frameworkQuery.data || [];
  const overall = stats?.progress ?? 0;

  const filteredGroups = useMemo(() => {
    if (selectedFramework === 'all') return groups;
    return groups.filter((group) => group.framework === selectedFramework);
  }, [groups, selectedFramework]);

  const refresh = () => {
    groupsQuery.refetch();
    statsQuery.refetch();
    frameworkQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tuân thủ bảo mật"
        description="Checklist ISO 27001, GDPR, SOC 2 và NIST từ database"
        action={
          <button onClick={refresh} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50 transition">
            <RefreshCw className={`h-4 w-4 ${groupsQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng kiểm tra" value={formatNumber(stats?.total ?? 0)} icon={CheckSquare} />
        <StatCard label="Đạt" value={formatNumber(stats?.passed ?? 0)} icon={CheckCircle} color="gradient-success" delay={0.05} />
        <StatCard label="Cảnh báo" value={formatNumber(stats?.warning ?? 0)} icon={AlertTriangle} color="gradient-warning" delay={0.1} />
        <StatCard label="Không đạt" value={formatNumber(stats?.failed ?? 0)} icon={XCircle} color="gradient-danger" delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tiến độ tuân thủ tổng thể</h3>
              <p className="text-xs text-muted-foreground">{formatNumber(stats?.passed ?? 0)} / {formatNumber(stats?.total ?? 0)} yêu cầu đã đáp ứng</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-gradient">{formatPercent(overall)}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-accent">
          <div className="h-full gradient-primary transition-all" style={{ width: `${overall}%` }} />
        </div>
      </motion.div>

      <DataState loading={groupsQuery.loading} error={groupsQuery.error} empty={!groupsQuery.loading && !groupsQuery.error && groups.length === 0} emptyText="Chưa có dữ liệu tuân thủ" onRetry={refresh}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {frameworkStats.map((framework, index) => {
            const meta = frameworkMeta[framework.framework] || { color: 'gradient-primary', icon: Shield };
            const Icon = meta.icon;
            const total = Number(framework.total || 0);
            const passed = Number(framework.passed || 0);
            const progress = total ? Math.round((passed / total) * 100) : 0;
            return (
              <motion.button
                key={framework.framework}
                onClick={() => setSelectedFramework(selectedFramework === framework.framework ? 'all' : framework.framework)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border bg-card p-5 text-left hover-lift ${selectedFramework === framework.framework ? 'border-primary/50 glow' : 'border-border'}`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${meta.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{framework.framework}</h3>
                <div className="mb-2 mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{passed} / {total}</span>
                  <span className="font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                  <div className={`h-full ${meta.color}`} style={{ width: `${progress}%` }} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {selectedFramework !== 'all' && (
          <button onClick={() => setSelectedFramework('all')} className="text-xs font-medium text-primary hover:underline">
            ← Bỏ lọc {selectedFramework}
          </button>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={`${group.framework}-${group.category}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="font-semibold">{group.category}</h3>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">{group.framework}</span>
              </div>
              <div className="space-y-2">
                {(group.items || []).map((item) => {
                  const current = statusIcon[item.status] || statusIcon.warning;
                  const Icon = current.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-accent/40 p-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${current.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${current.color}`} />
                      </div>
                      <span className="flex-1 text-xs">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </DataState>
    </div>
  );
}
