'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity, ArrowLeft, Ban, CheckCircle, Clock, FileText, Fingerprint, Globe,
  Loader2, MapPin, MessageSquare, Play, Send, Server, ShieldAlert, User as UserIcon, Zap,
} from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import api, { baseURL, getApiErrorMessage } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { formatDateTime } from '@/lib/format';

interface Alert {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  category: string | null;
  status: string;
  alert_type: string | null;
  ip_address: string | null;
  assigned_to: number | null;
  assigned_name: string | null;
  field_name: string | null;
  field_location: string | null;
  lead_time_minutes: number | null;
  predicted_at: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  telegram_sent: boolean;
  notified_at: string | null;
}

const severityColor: Record<string, string> = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  critical: 'bg-danger/10 text-danger border-danger/30',
};

const statusColor: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/30',
  processing: 'bg-warning/10 text-warning border-warning/30',
  resolved: 'bg-success/10 text-success border-success/30',
  ignored: 'bg-muted text-muted-foreground border-border',
  blocked: 'bg-danger/10 text-danger border-danger/30',
};

const statusLabel: Record<string, string> = {
  new: 'Mới',
  processing: 'Đang xử lý',
  resolved: 'Đã xử lý',
  ignored: 'Bỏ qua',
  blocked: 'Đã block',
};

function extractIP(text: string | null | undefined) {
  const match = text?.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  return match ? match[0] : null;
}

function serverHost() {
  try {
    return new URL(baseURL).host;
  } catch {
    return baseURL;
  }
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const alertQuery = useApiData<Alert>(id ? `/alerts/${id}` : null);
  const alert = alertQuery.data;
  const [note, setNote] = useState('');
  const [action, setAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const runAction = async (key: string, request: () => Promise<{ data?: { message?: string } }>, fallback: string) => {
    setAction(key);
    setNotice(null);
    try {
      const response = await request();
      setNotice({ type: 'ok', text: response.data?.message || fallback });
      alertQuery.refetch();
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setAction(null);
    }
  };

  const updateStatus = async (status: string) => {
    setAction(status);
    setNotice(null);
    try {
      const response = await api.put(`/alerts/${id}/status`, { status, note: note.trim() || undefined });
      setNotice({ type: 'ok', text: response.data?.message || 'Đã cập nhật trạng thái' });
      setNote('');
      alertQuery.refetch();
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setAction(null);
    }
  };

  const handleBlockIP = () => runAction(
    'block',
    () => api.post(`/alerts/${id}/block-ip`),
    'Đã block IP'
  );

  const handleAssign = () => runAction(
    'assign',
    () => api.put(`/alerts/${id}/assign`),
    'Đã nhận xử lý cảnh báo'
  );

  const handleNotify = () => runAction(
    'notify',
    () => api.post(`/alerts/${id}/notify`),
    'Đã gửi thông báo Telegram'
  );

  if (alertQuery.loading) {
    return <DataState loading />;
  }

  if (alertQuery.error || !alert) {
    return (
      <DataState
        error={alertQuery.error || 'Không tìm thấy cảnh báo'}
        onRetry={alertQuery.refetch}
      />
    );
  }

  const busy = action !== null;
  const severity = alert.severity?.toLowerCase() || 'medium';
  const status = alert.status?.toLowerCase() || 'new';
  const attackerIP = alert.ip_address || extractIP(`${alert.title} ${alert.description || ''}`) || 'Không xác định';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">ALERT-{String(alert.id).padStart(4, '0')}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[severity] || 'border-border bg-accent text-muted-foreground'}`}>{severity}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColor[status] || 'border-border bg-accent text-muted-foreground'}`}>{statusLabel[status] || alert.status}</span>
            {alert.telegram_sent && (
              <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                <Send className="h-3 w-3" /> Đã gửi Telegram
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{alert.title}</h1>
        </div>
      </div>

      {notice && (
        <div className={`rounded-xl border p-3 text-sm ${notice.type === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <div className={`rounded-2xl border p-6 ${severity === 'critical' ? 'border-danger/30 bg-danger/5' : 'border-border bg-card'}`}>
            <div className="mb-5 flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${severity === 'critical' ? 'gradient-danger' : 'gradient-warning'}`}>
                <ShieldAlert className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold">Mô tả</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{alert.description || 'Không có mô tả chi tiết.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 md:grid-cols-4">
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Fingerprint className="h-3 w-3" /> Phân loại
                </p>
                <p className="text-sm font-medium capitalize">{alert.category || '—'}</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" /> Nguồn tấn công
                </p>
                <p className="font-mono text-sm font-medium text-danger">{attackerIP}</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Server className="h-3 w-3" /> API giám sát
                </p>
                <p className="font-mono text-sm font-medium text-primary">{serverHost()}</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Thời gian
                </p>
                <p className="text-sm font-medium">{formatDateTime(alert.created_at)}</p>
              </div>
            </div>

            {alert.field_name && (
              <div className="mt-5 border-t border-border pt-5">
                <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Vùng canh tác liên quan
                </p>
                <p className="text-sm font-medium">{alert.field_name}{alert.field_location ? ` — ${alert.field_location}` : ''}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><Zap className="h-4 w-4 text-primary" />Hành động xử lý</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <button onClick={handleBlockIP} disabled={busy || attackerIP === 'Không xác định'} title={attackerIP === 'Không xác định' ? 'Cảnh báo không có IP' : undefined} className="flex flex-col items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger transition hover:bg-danger/20 disabled:opacity-50">
                {action === 'block' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" />}
                <span className="text-xs font-semibold">Block IP</span>
              </button>
              <button onClick={handleAssign} disabled={busy} className="flex flex-col items-center gap-2 rounded-xl border border-cyber/30 bg-cyber/10 p-4 text-cyber transition hover:bg-cyber/20 disabled:opacity-50">
                {action === 'assign' ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserIcon className="h-5 w-5" />}
                <span className="text-xs font-semibold">Nhận xử lý</span>
              </button>
              <button onClick={handleNotify} disabled={busy} className="flex flex-col items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning transition hover:bg-warning/20 disabled:opacity-50">
                {action === 'notify' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="text-xs font-semibold">Notify</span>
              </button>
              <button onClick={() => updateStatus('resolved')} disabled={busy} className="flex flex-col items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-success transition hover:bg-success/20 disabled:opacity-50">
                {action === 'resolved' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                <span className="text-xs font-semibold">Xử lý xong</span>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Ghi chú xử lý</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Nhập ghi chú xử lý..."
                className="w-full resize-none rounded-xl border border-border bg-input p-3.5 text-sm outline-none focus:border-primary/50"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => updateStatus('ignored')} disabled={busy} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50">Bỏ qua</button>
                <button onClick={() => updateStatus('processing')} disabled={busy} className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-white glow transition hover:opacity-90 disabled:opacity-50">
                  {action === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Bắt đầu xử lý
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-5 flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" />Timeline xử lý</h3>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-danger/30 bg-danger/10"><ShieldAlert className="h-4 w-4 text-danger" /></div>
                  <div className="mt-2 w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 pb-5">
                  <p className="text-sm font-medium">Phát hiện</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(alert.created_at)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Hệ thống tự động ghi nhận cảnh báo.</p>
                </div>
              </div>

              {alert.assigned_name && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-warning/30 bg-warning/10"><Fingerprint className="h-4 w-4 text-warning" /></div>
                    <div className="mt-2 w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-5">
                    <p className="text-sm font-medium">Đã giao xử lý</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{alert.assigned_name}</p>
                  </div>
                </div>
              )}

              {alert.notified_at && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10"><Send className="h-4 w-4 text-primary" /></div>
                    <div className="mt-2 w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-5">
                    <p className="text-sm font-medium">Đã gửi thông báo</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(alert.notified_at)}</p>
                  </div>
                </div>
              )}

              {status === 'resolved' && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-success/30 bg-success/10"><CheckCircle className="h-4 w-4 text-success" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Đã xử lý</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(alert.resolved_at)}</p>
                  </div>
                </div>
              )}

              {alert.resolution_note && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10"><MessageSquare className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ghi chú</p>
                    <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-accent/40 p-2.5 font-mono text-xs">{alert.resolution_note}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" />Thông tin bổ sung</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border py-2"><span className="text-muted-foreground">Loại sự cố</span><span className="text-right font-medium capitalize">{alert.alert_type || '—'}</span></div>
              <div className="flex justify-between gap-4 border-b border-border py-2"><span className="text-muted-foreground">Mức độ</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityColor[severity] || 'border-border bg-accent text-muted-foreground'}`}>{severity}</span></div>
              <div className="flex justify-between gap-4 border-b border-border py-2"><span className="text-muted-foreground">Trạng thái</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor[status] || 'border-border bg-accent text-muted-foreground'}`}>{statusLabel[status] || alert.status}</span></div>
              <div className="flex justify-between gap-4 border-b border-border py-2"><span className="text-muted-foreground">Người xử lý</span><span className="text-right font-medium">{alert.assigned_name || 'Chưa giao'}</span></div>
              <div className="flex justify-between gap-4 border-b border-border py-2"><span className="text-muted-foreground">Dự báo trước</span><span className="font-medium">{alert.lead_time_minutes != null ? `${alert.lead_time_minutes} phút` : '—'}</span></div>
              <div className="flex justify-between gap-4 py-2"><span className="text-muted-foreground">Dự đoán lúc</span><span className="text-right font-medium">{formatDateTime(alert.predicted_at)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
