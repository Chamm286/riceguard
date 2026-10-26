"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, ShieldAlert, FileText, MapPin, Settings,
  Shield, LogOut, Fingerprint, FileBarChart, Home, Leaf,
  Cloud, BookOpen, Bell, Users, Activity, ScrollText,
  FlaskConical, Target, Server, Terminal, LucideIcon, X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface MenuSection {
  title: string;
  roles: string[];
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Nông dân",
    roles: ["farmer"],
    items: [
      { href: "/farmer/dashboard", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/farmer/upload", label: "Gửi báo cáo", icon: Leaf },
      { href: "/farmer/my-reports", label: "Báo cáo của tôi", icon: FileBarChart },
      { href: "/farmer/fields", label: "Vùng canh tác", icon: MapPin },
      { href: "/farmer/weather", label: "Thời tiết", icon: Cloud },
      { href: "/farmer/knowledge", label: "Thư viện bệnh", icon: BookOpen },
      { href: "/farmer/alerts", label: "Cảnh báo", icon: Bell, badge: "farmerAlerts" },
    ],
  },
  {
    title: "An ninh mạng",
    roles: ["admin", "analyst"],
    items: [
      { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/analyst/dashboard", label: "Analyst Console", icon: Terminal },
      { href: "/threats", label: "Mối đe dọa", icon: ShieldAlert, badge: "threats" },
      { href: "/alerts", label: "Cảnh báo", icon: Bell },
      { href: "/investigations", label: "Điều tra", icon: Fingerprint },
      { href: "/logs", label: "Nhật ký", icon: FileText },
      { href: "/assets", label: "Tài sản", icon: Server },
    ],
  },
  {
    title: "Nông nghiệp",
    roles: ["admin", "analyst"],
    items: [
      { href: "/cyber/farmer-reports", label: "Báo cáo lúa", icon: Leaf },
      { href: "/fields", label: "Vùng canh tác", icon: MapPin },
      { href: "/reports", label: "Báo cáo tổng hợp", icon: FileBarChart },
    ],
  },
  {
    title: "Vận hành",
    roles: ["admin", "analyst"],
    items: [
      { href: "/playbooks", label: "Playbooks", icon: FlaskConical },
      { href: "/automation", label: "Tự động hóa", icon: Target },
      { href: "/compliance", label: "Tuân thủ", icon: ScrollText },
    ],
  },
  {
    title: "Quản trị",
    roles: ["admin"],
    items: [
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/visitors", label: "Người truy cập", icon: Activity, badge: "visitorAlerts" },
      { href: "/admin/system", label: "Hệ thống", icon: Activity },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText },
      { href: "/settings", label: "Cài đặt", icon: Settings },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || "viewer";
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:5000/api/stats/sidebar", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setBadges(json.data);
      } catch { /* ignore */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleSections = menuSections.filter((s) => s.roles.includes(role));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-background transition-transform duration-200 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <Link href="/" className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 transition hover:bg-accent">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[13px] font-semibold tracking-tight">RiceGuard</h1>
              <p className="truncate text-[10px] text-muted-foreground">Security Platform</p>
            </div>
          </Link>
          <button onClick={onClose} aria-label="Đóng menu" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4 space-y-6">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition",
                        isActive
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/80")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && badges[item.badge] > 0 && (
                        <span className={cn(
                          "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                          isActive ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"
                        )}>
                          {badges[item.badge]}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <Link
            href="/"
            onClick={onClose}
            className="flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="flex-1">Trang chủ</span>
          </Link>
        </nav>

        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 rounded-md p-1.5 transition hover:bg-accent">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-[11px] font-semibold">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.full_name || "User"}</p>
              <p className="text-[10px] capitalize text-muted-foreground">{role}</p>
            </div>
            <button onClick={logout} aria-label="Đăng xuất" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-danger/10 hover:text-danger">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
