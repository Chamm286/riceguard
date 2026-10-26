'use client';

import { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children?: ReactNode;
  compact?: boolean;
}

export function DataState({
  loading,
  error,
  empty,
  emptyText = 'Chưa có dữ liệu',
  onRetry,
  children,
  compact,
}: DataStateProps) {
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-border bg-card ${compact ? 'p-8' : 'p-12'}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger/5 ${compact ? 'p-8' : 'p-12'}`}>
        <AlertTriangle className="h-7 w-7 text-danger" />
        <p className="mt-3 text-sm font-medium text-danger">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 flex items-center gap-2 rounded-md border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card ${compact ? 'p-8' : 'p-12'}`}>
        <Inbox className="h-7 w-7 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}
