'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('new_log', (l) => setLogs(prev => [l, ...prev].slice(0, 100)));
    return () => { socket.disconnect(); };
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Logs realtime</h1>
      <div className="font-mono text-sm space-y-1">
        {logs.map((l, i) => <div key={i}>{l.message}</div>)}
      </div>
    </div>
  );
}
