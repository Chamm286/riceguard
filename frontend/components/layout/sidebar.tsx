"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, ShieldAlert, FileText, MapPin, Settings,
  Shield, LogOut, Fingerprint, FileBarChart, Home, Leaf,
  Cloud, BookOpen, Bell, Users, Activity, ScrollText, Bug,
  FlaskConical, Target, BarChart3, Server, LucideIcon
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
    title: "🌾 Nông dân",
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
    title: "🛡️ An ninh mạng",
    roles: ["admin", "analyst"],
    items: [
      { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/threats", label: "Mối đe dọa", icon: ShieldAlert, badge: "threats" },
      { href: "/alerts", label: "Cảnh báo", icon: Bell },
      { href: "/investigations", label: "Điều tra", icon: Fingerprint },
      { href: "/logs", label: "Nhật ký", icon: FileText },
      { href: "/assets", label: "Tài sản", icon: Server },
    ],
  },
  {
    title: "🌾 Nông nghiệp",
    roles: ["admin", "analyst"],
    items: [
      { href: "/cyber/farmer-reports", label: "Báo cáo lúa", icon: Leaf },
      { href: "/fields", label: "Vùng canh tác", icon: MapPin },
      { href: "/reports", label: "Báo cáo tổng hợp", icon: FileBarChart },
    ],
  },
  {
    title: "⚙️ Vận hành",
    roles: ["admin", "analyst"],
    items: [
      { href: "/playbooks", label: "Playbooks", icon: FlaskConical },
      { href: "/automation", label: "Tự động hóa", icon: Target },
      { href: "/compliance", label: "Tuân thủ", icon: ScrollText },
    ],
  },
  {
    title: "🔧 Quản trị",
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

export function Sidebar() {
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
      } catch (e) { /* ignore */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleSections = menuSections.filter((s) => s.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <Link href="/" className="group flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-primary/5 transition">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow shrink-0 group-hover:scale-105 transition">
            <Shield className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight group-hover:text-primary transition">RiceGuard</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Security Platform</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "gradient-primary text-white shadow-lg glow"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110")} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isActive ? "bg-white/25 text-white" : "bg-danger text-white animate-pulse"
                      )}>
                        {badges[item.badge] || 0}
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
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition"
        >
          <Home className="h-4 w-4" />
          <span className="flex-1">Trang chủ</span>
        </Link>
      </nav>

      <div className="border-t border-border p-3">
        <div className="group flex items-center gap-3 rounded-xl bg-accent/50 hover:bg-accent transition p-2.5">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
            role === "admin" ? "gradient-danger" :
            role === "analyst" ? "gradient-cyber" :
            role === "farmer" ? "gradient-success" : "gradient-primary"
          )}>
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.full_name || "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-danger/20 transition text-muted-foreground hover:text-danger">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
