'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  sub?: string;
  delay?: number;
  loading?: boolean;
}

function toneClass(color: string) {
  if (color.includes('danger')) return 'text-danger';
  if (color.includes('warning')) return 'text-warning';
  if (color.includes('success')) return 'text-success';
  if (color.includes('cyber')) return 'text-cyber';
  return 'text-primary';
}

export function StatCard({ label, value, icon: Icon, color = 'gradient-primary', sub, delay = 0, loading = false }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 shrink-0 ${toneClass(color)}`} />
      </div>
      {loading ? (
        <>
          <div className="mt-2 h-[22px] w-16 animate-pulse rounded bg-secondary" />
          <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-secondary/70" />
        </>
      ) : (
        <>
          <p className="mt-2 text-[22px] font-semibold leading-none tracking-tight">{value}</p>
          {sub && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
        </>
      )}
    </motion.div>
  );
}
