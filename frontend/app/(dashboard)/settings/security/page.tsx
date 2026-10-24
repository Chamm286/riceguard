'use client';

import { useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import api, { getApiErrorMessage } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';

interface SecuritySettings {
  auto_block_enabled: boolean;
  whitelist_ips: string[];
}

export default function SecuritySettingsPage() {
  const settingsQuery = useApiData<SecuritySettings>('/settings/security');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình bảo mật"
        description="Thiết lập tự động chặn IP và whitelist từ database"
      />

      <DataState
        loading={settingsQuery.loading}
        error={settingsQuery.error}
        onRetry={settingsQuery.refetch}
      >
        {settingsQuery.data && (
          <SecurityForm settings={settingsQuery.data} onSaved={settingsQuery.refetch} />
        )}
      </DataState>
    </div>
  );
}

function SecurityForm({ settings, onSaved }: { settings: SecuritySettings; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(settings.auto_block_enabled);
  const [whitelist, setWhitelist] = useState((settings.whitelist_ips || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const save = async () => {
    const ips = whitelist.split(',').map((item) => item.trim()).filter(Boolean);
    setSaving(true);
    setNotice(null);
    try {
      const response = await api.put('/settings/security', {
        auto_block_enabled: enabled,
        whitelist_ips: ips,
      });
      setNotice({ type: 'ok', text: response.data?.message || 'Đã lưu cấu hình' });
      onSaved();
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6">
      {notice && (
        <div className={`rounded-xl border p-3 text-sm ${notice.type === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
          {notice.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-accent/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Tự động chặn IP độc hại</p>
            <p className="text-xs text-muted-foreground">Áp dụng firewall khi phát hiện IP nguy hiểm.</p>
          </div>
        </div>
        <button
          onClick={() => setEnabled((value) => !value)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-success' : 'bg-muted'}`}
          aria-pressed={enabled}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Whitelist IP (cách nhau bằng dấu phẩy)</label>
        <input
          value={whitelist}
          onChange={(event) => setWhitelist(event.target.value)}
          className="w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
          placeholder="1.2.3.4, 5.6.7.8"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
