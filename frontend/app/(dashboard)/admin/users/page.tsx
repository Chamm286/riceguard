'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lock, Search, ShieldCheck, Unlock, Users } from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import api, { getApiErrorMessage } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { formatDateTime, formatNumber } from '@/lib/format';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  telegram_chat_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

function roleColor(role: string) {
  if (role === 'admin') return 'gradient-danger';
  if (role === 'analyst') return 'gradient-cyber';
  if (role === 'farmer') return 'gradient-success';
  return 'gradient-primary';
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const usersQuery = useApiData<User[]>('/users');
  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      user.username?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  }, [users, search]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.is_active).length,
    admins: users.filter((user) => user.role === 'admin').length,
    analysts: users.filter((user) => user.role === 'analyst').length,
  }), [users]);

  const toggleStatus = async (user: User) => {
    setActionId(user.id);
    setNotice(null);
    try {
      const response = await api.put(`/users/${user.id}/status`, { is_active: !user.is_active });
      setNotice({ type: 'ok', text: response.data?.message || 'Đã cập nhật tài khoản' });
      usersQuery.refetch();
    } catch (err) {
      setNotice({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description={`${formatNumber(users.length)} người dùng trong hệ thống`}
      />

      {notice && (
        <div className={`rounded-xl border p-3 text-sm ${notice.type === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng người dùng" value={formatNumber(stats.total)} icon={Users} />
        <StatCard label="Đang hoạt động" value={formatNumber(stats.active)} icon={ShieldCheck} color="gradient-success" delay={0.05} />
        <StatCard label="Admin" value={formatNumber(stats.admins)} icon={Lock} color="gradient-danger" delay={0.1} />
        <StatCard label="Analyst" value={formatNumber(stats.analysts)} icon={Unlock} color="gradient-cyber" delay={0.15} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo username, tên, email hoặc vai trò..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <DataState
        loading={usersQuery.loading}
        error={usersQuery.error}
        empty={!usersQuery.loading && !usersQuery.error && filtered.length === 0}
        emptyText="Không có người dùng nào"
        onRetry={usersQuery.refetch}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đăng nhập cuối</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    className="border-b border-border transition last:border-0 hover:bg-accent/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${roleColor(user.role)} text-xs font-bold text-white`}>
                          {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{user.full_name || user.username}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${roleColor(user.role)} text-white`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(user.last_login)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${user.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                        <span className={`h-2 w-2 rounded-full ${user.is_active ? 'animate-pulse bg-success' : 'bg-muted-foreground'}`} />
                        {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(user)}
                        disabled={actionId === user.id}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition disabled:opacity-50 ${
                          user.is_active
                            ? 'border-danger/30 bg-danger/10 text-danger hover:bg-danger/20'
                            : 'border-success/30 bg-success/10 text-success hover:bg-success/20'
                        }`}
                      >
                        {actionId === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : user.is_active ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                        {user.is_active ? 'Khóa' : 'Kích hoạt'}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DataState>
    </div>
  );
}
