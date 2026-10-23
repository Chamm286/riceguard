'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SecuritySettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [whitelist, setWhitelist] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings/security').then(r => {
      setEnabled(r.data.data?.auto_block_enabled ?? true);
      setWhitelist((r.data.data?.whitelist_ips || []).join(', '));
    }).catch(() => {});
  }, []);

  const save = async () => {
    const ips = whitelist.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await api.put('/settings/security', { auto_block_enabled: enabled, whitelist_ips: ips });
      setMsg('Đã lưu cấu hình');
    } catch (e) {
      setMsg('Lỗi lưu cấu hình');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Security Settings</h1>
      <div className="flex items-center gap-3">
        <span>Tự động chặn IP độc hại</span>
        <button onClick={() => setEnabled(!enabled)}
          className={`px-4 py-2 rounded ${enabled ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
          {enabled ? 'Bật' : 'Tắt'}
        </button>
      </div>
      <div>
        <label className="block mb-1">Whitelist IP (cách nhau bằng dấu phẩy)</label>
        <input value={whitelist} onChange={e => setWhitelist(e.target.value)}
          className="w-full border rounded p-2" placeholder="1.2.3.4, 5.6.7.8" />
      </div>
      <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
