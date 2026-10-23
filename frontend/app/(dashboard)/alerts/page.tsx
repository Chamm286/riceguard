'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [severity, setSeverity] = useState('');
  useEffect(() => {
    api.get('/alerts', { params: severity ? { severity } : {} })
      .then(r => setAlerts(r.data.data || []));
  }, [severity]);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Alerts</h1>
      <select value={severity} onChange={e => setSeverity(e.target.value)} className="mb-4 border rounded p-2">
        <option value="">All</option><option value="high">High</option>
        <option value="medium">Medium</option><option value="low">Low</option>
      </select>
      <table className="w-full border">
        <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>IP</th><th>Status</th></tr></thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.id} className="border-t">
              <td>{a.id}</td><td>{a.title}</td><td>{a.severity}</td>
              <td>{a.ip_address}</td><td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
