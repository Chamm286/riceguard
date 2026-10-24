'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Bell, CheckCircle, Cpu, Database, HardDrive, Key, Loader2, LucideIcon,
  MemoryStick, Save, Search, Send, Server, Shield, User, Users, Wifi,
} from 'lucide-react';
import { useAuth, type User as AuthUser } from '@/hooks/use-auth';
import { useApiData } from '@/hooks/use-api-data';
import api, { getApiErrorMessage } from '@/lib/api';
import { DataState } from '@/components/common/data-state';
import { formatBytes, formatDateTime, formatDuration, formatNumber } from '@/lib/format';
import type { SystemStatus } from '../admin/system/page';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  telegram_chat_id?: string | null;
  last_login?: string | null;
  created_at?: string | null;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  last_login: string | null;
  created_at: string;
}

const baseTabs = [
  { id: 'profile', label: 'Cá nhân', icon: User },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'security', label: 'Bảo mật', icon: Shield },
];

const adminTabs = [
  { id: 'users', label: 'Người dùng', icon: Users },
  { id: 'system', label: 'Hệ thống', icon: Server },
];

const NOTIFICATION_KEY = 'riceguard_notification_prefs';
const NOTIFICATION_EVENT = 'riceguard-notification-change';
const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  critical: true,
  high: true,
  disease: true,
  login: false,
  report: true,
  weekly: true,
};

function subscribeNotifications(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(NOTIFICATION_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(NOTIFICATION_EVENT, callback);
  };
}

function getNotificationSnapshot() {
  if (typeof window === 'undefined') return JSON.stringify(DEFAULT_NOTIFICATIONS);
  return localStorage.getItem(NOTIFICATION_KEY) || JSON.stringify(DEFAULT_NOTIFICATIONS);
}

function getServerNotificationSnapshot() {
  return JSON.stringify(DEFAULT_NOTIFICATIONS);
}

const notificationTypes = [
  { key: 'critical', label: 'Cảnh báo Critical', desc: 'Bất kỳ sự cố nào mức Critical' },
  { key: 'high', label: 'Cảnh báo High', desc: 'Sự cố mức High' },
  { key: 'disease', label: 'Vàng lá lúa', desc: 'Cảnh báo dịch bệnh cây trồng' },
  { key: 'login', label: 'Đăng nhập bất thường', desc: 'Login từ IP lạ' },
  { key: 'report', label: 'Báo cáo hàng ngày', desc: 'Tổng kết 24h' },
  { key: 'weekly', label: 'Báo cáo tuần', desc: 'Tổng kết mỗi thứ 2' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const meQuery = useApiData<UserProfile>('/auth/me');
  const me = meQuery.data;
  const role = me?.role || user?.role || 'viewer';
  const isAdmin = role === 'admin';
  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;
  const [tab, setTab] = useState('profile');

  const usersQuery = useApiData<AdminUser[]>('/users', { enabled: isAdmin });
  const systemQuery = useApiData<SystemStatus>('/system/status', { enabled: isAdmin && tab === 'system', pollMs: 20000 });

  const [password, setPassword] = useState({ current_password: '', new_password: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const notificationSnapshot = useSyncExternalStore(
    subscribeNotifications,
    getNotificationSnapshot,
    getServerNotificationSnapshot
  );
  const notifications = useMemo(() => {
    try {
      return JSON.parse(notificationSnapshot) as Record<string, boolean>;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  }, [notificationSnapshot]);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data || [];
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((item) =>
      item.full_name?.toLowerCase().includes(query) ||
      item.username?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.role?.toLowerCase().includes(query)
    );
  }, [usersQuery.data, userSearch]);

  const changePassword = async () => {
    if (password.new_password !== password.confirm) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await api.put('/auth/password', {
        current_password: password.current_password,
        new_password: password.new_password,
      });
      setPassword({ current_password: '', new_password: '', confirm: '' });
      setPasswordMsg({ type: 'ok', text: 'Đã đổi mật khẩu' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setPasswordSaving(false);
    }
  };

  const toggleNotification = (key: string) => {
    const next = { ...notifications, [key]: !notifications[key] };
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(NOTIFICATION_EVENT));
  };

  const saveNotifications = () => {
    setNotificationSaved(true);
    setTimeout(() => setNotificationSaved(false), 2500);
  };

  const status = systemQuery.data;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-3">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active ? 'border border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="col-span-12 space-y-6 md:col-span-9">
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-5 font-semibold">Thông tin cá nhân</h3>
            <DataState loading={meQuery.loading} error={meQuery.error} onRetry={meQuery.refetch} compact>
              {me && <ProfileForm me={me} user={user} onSaved={meQuery.refetch} />}
            </DataState>
          </motion.div>
        )}

        {tab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {me ? (
              <TelegramForm me={me} user={user} onSaved={meQuery.refetch} />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Đang tải hồ sơ...</div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Loại thông báo</h3>
              <div className="space-y-1">
                {notificationTypes.map((item) => (
                  <div key={item.key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(item.key)}
                      className={`relative h-6 w-11 rounded-full transition ${notifications[item.key] ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${notifications[item.key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={saveNotifications} className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow">Lưu tùy chọn</button>
                {notificationSaved && <span className="text-xs text-success">Đã lưu trên thiết bị này</span>}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold"><Key className="h-4 w-4 text-primary" />Đổi mật khẩu</h3>
              <div className="space-y-3">
                <input type="password" value={password.current_password} onChange={(event) => setPassword({ ...password, current_password: event.target.value })} placeholder="Mật khẩu hiện tại" className="h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
                <input type="password" value={password.new_password} onChange={(event) => setPassword({ ...password, new_password: event.target.value })} placeholder="Mật khẩu mới" className="h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
                <input type="password" value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} placeholder="Xác nhận mật khẩu mới" className="h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
              </div>
              {passwordMsg && <Notice type={passwordMsg.type}>{passwordMsg.text}</Notice>}
              <button onClick={changePassword} disabled={passwordSaving} className="mt-4 flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow disabled:opacity-50">
                {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật mật khẩu
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold"><Shield className="h-4 w-4 text-primary" />Phiên hiện tại</h3>
              <div className="rounded-xl bg-accent/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tài khoản: {me?.email || user?.email}</p>
                    <p className="text-xs text-muted-foreground">Đăng nhập gần nhất: {formatDateTime(me?.last_login)}</p>
                  </div>
                  <button onClick={logout} className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10">Đăng xuất</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'users' && isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex max-w-md flex-1 items-center gap-3 rounded-xl border border-border bg-input px-3.5 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Tìm user..." className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              <span className="text-xs text-muted-foreground">{filteredUsers.length} người dùng</span>
            </div>

            <DataState loading={usersQuery.loading} error={usersQuery.error} empty={!usersQuery.loading && !usersQuery.error && filteredUsers.length === 0} emptyText="Không có người dùng" onRetry={usersQuery.refetch}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-accent/50 text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Người dùng</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Vai trò</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Đăng nhập cuối</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((item) => (
                        <tr key={item.id} className="hover:bg-accent/30 transition">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">{item.full_name?.charAt(0) || 'U'}</div>
                              <div>
                                <p className="font-medium">{item.full_name}</p>
                                <p className="text-xs text-muted-foreground">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                              item.role === 'admin' ? 'border-danger/30 bg-danger/10 text-danger' :
                              item.role === 'analyst' ? 'border-cyber/30 bg-cyber/10 text-cyber' :
                              'border-border bg-accent text-muted-foreground'
                            }`}>{item.role}</span>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">{formatDateTime(item.last_login)}</td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DataState>
          </motion.div>
        )}

        {tab === 'system' && isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <DataState loading={systemQuery.loading} error={systemQuery.error} onRetry={systemQuery.refetch}>
              {status && (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <MiniMetric icon={Cpu} label="CPU" value={`${status.system.cpu.usagePercent}%`} />
                    <MiniMetric icon={MemoryStick} label="RAM" value={formatBytes(status.system.memory.usedBytes)} />
                    <MiniMetric icon={HardDrive} label="Disk" value={`${status.system.disk.usedPercent}%`} />
                    <MiniMetric icon={Wifi} label="Services" value={`${status.services.filter((service) => service.online).length}/${status.services.length}`} />
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold"><Database className="h-4 w-4 text-primary" />Database</h3>
                    <div className="space-y-2 text-sm">
                      <Row label="Database" value={status.database.name || '—'} />
                      <Row label="Latency" value={`${status.database.latencyMs} ms`} />
                      <Row label="Kích thước" value={formatBytes(status.database.sizeBytes)} />
                      <Row label="Uptime backend" value={formatDuration(status.uptimeSeconds)} />
                      <Row label="Tổng log" value={formatNumber(status.counts.logs)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 font-semibold">Dịch vụ</h3>
                    <div className="space-y-2">
                      {status.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between rounded-xl bg-accent/40 p-3.5">
                          <div className="flex items-center gap-3">
                            {service.online ? <CheckCircle className="h-4 w-4 text-success" /> : <Activity className="h-4 w-4 text-danger" />}
                            <div>
                              <p className="text-sm font-medium">{service.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{service.port ? `:${service.port}` : 'internal'}{service.latencyMs !== undefined ? ` • ${service.latencyMs}ms` : ''}</p>
                            </div>
                          </div>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${service.online ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
                            {service.online ? 'Running' : 'Down'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </DataState>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ProfileForm({ me, user, onSaved }: { me: UserProfile; user: AuthUser | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: me.full_name || '',
    email: me.email || '',
    telegram_chat_id: me.telegram_chat_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/auth/me', form);
      const updated = res.data?.user || res.data?.data;
      if (updated) localStorage.setItem('user', JSON.stringify({ ...(user || {}), ...updated }));
      setMessage({ type: 'ok', text: 'Đã cập nhật hồ sơ' });
      onSaved();
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-white glow">
          {me.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="text-lg font-semibold">{me.full_name}</p>
          <p className="text-sm text-muted-foreground">@{me.username} • {me.email}</p>
          <span className="mt-1 inline-block rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
            {me.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Họ và tên">
          <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
        </Field>
        <Field label="Telegram Chat ID">
          <input value={form.telegram_chat_id} onChange={(event) => setForm({ ...form, telegram_chat_id: event.target.value })} placeholder="Chưa cấu hình" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
        </Field>
        <Field label="Đăng nhập gần nhất">
          <div className="mt-1.5 flex h-11 items-center rounded-xl border border-border bg-accent/40 px-3.5 text-sm text-muted-foreground">
            {formatDateTime(me.last_login)}
          </div>
        </Field>
      </div>

      {message && <Notice type={message.type}>{message.text}</Notice>}

      <button onClick={save} disabled={saving} className="mt-6 flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow hover:opacity-90 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Lưu thay đổi
      </button>
    </>
  );
}

function TelegramForm({ me, user, onSaved }: { me: UserProfile; user: AuthUser | null; onSaved: () => void }) {
  const [chatId, setChatId] = useState(me.telegram_chat_id || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/auth/me', {
        full_name: me.full_name,
        email: me.email,
        telegram_chat_id: chatId,
      });
      const updated = res.data?.user || res.data?.data;
      if (updated) localStorage.setItem('user', JSON.stringify({ ...(user || {}), ...updated }));
      setMessage({ type: 'ok', text: 'Đã lưu Chat ID' });
      onSaved();
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><Send className="h-4 w-4 text-primary" />Telegram Bot</h3>
      <p className="mb-4 text-xs text-muted-foreground">Chat ID được lưu trong hồ sơ cá nhân và dùng bởi workflow n8n</p>
      <div className="flex gap-2">
        <input value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="Chat ID Telegram" className="h-11 flex-1 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
        <button onClick={save} disabled={saving} className="flex h-11 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-white glow disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu
        </button>
      </div>
      {message && <Notice type={message.type}>{message.text}</Notice>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

function Notice({ type, children }: { type: 'ok' | 'error'; children: React.ReactNode }) {
  return <div className={`mt-4 rounded-xl border p-3 text-sm ${type === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>{children}</div>;
}

function MiniMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p></div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-border py-2 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-mono text-xs">{value}</span></div>;
}
