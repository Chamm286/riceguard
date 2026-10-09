"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  User, Shield, Bell, Server, Users, Save, Key, Database,
  Activity, Cpu, HardDrive, Wifi, Plus, Trash2, Edit, Search,
  CheckCircle, XCircle, AlertTriangle, Send
} from "lucide-react";

const tabs = [
  { id: "profile", label: "Cá nhân", icon: User },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: Shield },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "system", label: "Hệ thống", icon: Server },
];

const mockUsers = [
  { id: 1, name: "Nguyễn Thị Bích Trâm", email: "tramntb.24it@vku.udn.vn", role: "admin", status: "active", lastLogin: "Vừa xong" },
  { id: 2, name: "Tống Mỹ Trà", email: "tra.tm.24it@vku.udn.vn", role: "analyst", status: "active", lastLogin: "5 phút trước" },
  { id: 3, name: "Trần Anh Tuấn", email: "tuan.ta.24it@vku.udn.vn", role: "analyst", status: "active", lastLogin: "1 giờ trước" },
  { id: 4, name: "Nguyễn Hữu Thuận", email: "thuan.nh.24it@vku.udn.vn", role: "viewer", status: "active", lastLogin: "2 giờ trước" },
  { id: 5, name: "Trần Văn Tri", email: "tri.tv.24it@vku.udn.vn", role: "analyst", status: "inactive", lastLogin: "3 ngày trước" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");
  const [notifStates, setNotifStates] = useState({
    critical: true, high: true, disease: true, login: false, report: true, weekly: true,
  });

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar tabs */}
      <div className="col-span-12 md:col-span-3">
        <div className="rounded-2xl border border-border bg-card p-2 sticky top-24">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="col-span-12 md:col-span-9 space-y-6">
        {/* PROFILE */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-5">Thông tin cá nhân</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-white glow">
                {user?.full_name?.charAt(0) || "A"}
              </div>
              <div>
                <p className="text-lg font-semibold">{user?.full_name || "Admin"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  {user?.role || "admin"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Họ và tên</label>
                <input defaultValue={user?.full_name} className="mt-1.5 w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input defaultValue={user?.email} className="mt-1.5 w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Số điện thoại</label>
                <input placeholder="0934984665" className="mt-1.5 w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Chức vụ</label>
                <input placeholder="Security Analyst" className="mt-1.5 w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
            <button className="mt-6 flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow hover:opacity-90">
              <Save className="h-4 w-4" /> Lưu thay đổi
            </button>
          </motion.div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-1 flex items-center gap-2"><Send className="h-4 w-4 text-primary" />Telegram Bot</h3>
              <p className="text-xs text-muted-foreground mb-4">Nhận cảnh báo tức thời qua Telegram</p>
              <div className="flex gap-2">
                <input placeholder="Chat ID Telegram" className="flex-1 h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
                <button className="h-11 rounded-xl gradient-primary px-5 text-sm font-semibold text-white glow">Kết nối</button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Loại thông báo</h3>
              <div className="space-y-1">
                {[
                  { key: "critical", label: "Cảnh báo Critical", desc: "Bất kỳ sự cố nào mức Critical" },
                  { key: "high", label: "Cảnh báo High", desc: "Sự cố mức High" },
                  { key: "disease", label: "Vàng lá lúa", desc: "Cảnh báo dịch bệnh cây trồng" },
                  { key: "login", label: "Đăng nhập bất thường", desc: "Login từ IP lạ" },
                  { key: "report", label: "Báo cáo hàng ngày", desc: "Tổng kết 24h" },
                  { key: "weekly", label: "Báo cáo tuần", desc: "Tổng kết mỗi thứ 2" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifStates({ ...notifStates, [n.key]: !notifStates[n.key as keyof typeof notifStates] })}
                      className={`h-6 w-11 rounded-full transition ${notifStates[n.key as keyof typeof notifStates] ? "bg-primary" : "bg-muted"} relative`}
                    >
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${notifStates[n.key as keyof typeof notifStates] ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Key className="h-4 w-4 text-primary" />Đổi mật khẩu</h3>
              <div className="space-y-3">
                <input type="password" placeholder="Mật khẩu hiện tại" className="w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
                <input type="password" placeholder="Mật khẩu mới" className="w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
                <input type="password" placeholder="Xác nhận mật khẩu mới" className="w-full h-11 rounded-xl border border-border bg-input px-3.5 text-sm outline-none focus:border-primary/50" />
              </div>
              <button className="mt-4 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow">Cập nhật mật khẩu</button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Xác thực 2 lớp (2FA)</h3>
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/40">
                <div>
                  <p className="text-sm font-medium">Trạng thái 2FA</p>
                  <p className="text-xs text-muted-foreground">Chưa kích hoạt</p>
                </div>
                <button className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20">Bật 2FA</button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Phiên đăng nhập gần đây</h3>
              <div className="space-y-2">
                {[
                  { ip: "192.168.1.10", device: "Chrome / Linux", time: "Vừa xong", current: true },
                  { ip: "192.168.1.15", device: "Firefox / Windows", time: "2 giờ trước", current: false },
                  { ip: "203.113.45.67", device: "Safari / macOS", time: "1 ngày trước", current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-accent/40">
                    <div>
                      <p className="text-sm font-mono">{s.ip}</p>
                      <p className="text-xs text-muted-foreground">{s.device} • {s.time}</p>
                    </div>
                    {s.current ? (
                      <span className="rounded-full bg-success/10 border border-success/30 px-2.5 py-0.5 text-[10px] font-semibold text-success">HIỆN TẠI</span>
                    ) : (
                      <button className="text-xs text-danger hover:underline">Thu hồi</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
              <div className="flex-1 flex items-center gap-3 rounded-xl border border-border bg-input px-3.5 py-2.5 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input placeholder="Tìm user..." className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              <button className="ml-3 flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white glow">
                <Plus className="h-4 w-4" /> Thêm user
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/50 text-xs uppercase">
                    <tr>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Người dùng</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Vai trò</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Trạng thái</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Đăng nhập cuối</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                            u.role === "admin" ? "bg-danger/10 text-danger border-danger/30" :
                            u.role === "analyst" ? "bg-cyber/10 text-cyber border-cyber/30" :
                            "bg-muted text-muted-foreground border-border"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`flex items-center gap-1.5 w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            u.status === "active" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground border-border"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                            {u.status === "active" ? "Hoạt động" : "Ngừng"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{u.lastLogin}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SYSTEM */}
        {tab === "system" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CPU", value: "23%", icon: Cpu, color: "text-success" },
                { label: "RAM", value: "4.2 GB", icon: Activity, color: "text-success" },
                { label: "Disk", value: "45%", icon: HardDrive, color: "text-warning" },
                { label: "Network", value: "1.2 MB/s", icon: Wifi, color: "text-primary" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Cấu hình Database
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Host", value: "localhost:5432" },
                  { label: "Database", value: "riceguard" },
                  { label: "Schema", value: "public" },
                  { label: "Uptime", value: "99.98%" },
                  { label: "Kích thước", value: "12.5 MB" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span className="flex items-center gap-1.5 text-success">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Dịch vụ hệ thống</h3>
              <div className="space-y-2">
                {[
                  { name: "Backend API", status: "running", port: 5000 },
                  { name: "PostgreSQL", status: "running", port: 5432 },
                  { name: "n8n Automation", status: "running", port: 5678 },
                  { name: "Redis Cache", status: "running", port: 6379 },
                  { name: "Nginx Proxy", status: "running", port: 80 },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3.5 rounded-xl bg-accent/40">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">:{s.port}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-success/10 border border-success/30 px-2.5 py-0.5 text-[10px] font-semibold text-success uppercase">
                      Running
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
