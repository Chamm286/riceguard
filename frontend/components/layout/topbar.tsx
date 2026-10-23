"use client";
import { Bell, Search, Activity } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, { title: string; desc: string }> = {
  "/dashboard": { title: "Tổng quan hệ thống", desc: "Giám sát an ninh mạng realtime" },
  "/alerts": { title: "Quản lý cảnh báo", desc: "Phân loại và xử lý sự cố" },
  "/investigations": { title: "Điều tra sự cố", desc: "Theo dõi và phân tích chuyên sâu" },
  "/threats": { title: "Mối đe dọa", desc: "Threat intelligence & feeds" },
  "/automation": { title: "Tự động hóa n8n", desc: "4 luồng workflows đang hoạt động" },
  "/logs": { title: "Nhật ký hệ thống", desc: "Lịch sử truy cập và sự kiện" },
  "/fields": { title: "Vùng canh tác", desc: "Giám sát khu vực trồng lúa" },
  "/assets": { title: "Quản lý tài sản", desc: "Server, sensor, IoT devices" },
  "/playbooks": { title: "Playbooks", desc: "Kịch bản xử lý sự cố" },
  "/compliance": { title: "Tuân thủ bảo mật", desc: "Checklist ISO 27001, GDPR" },
  "/reports": { title: "Báo cáo & Thống kê", desc: "Xuất báo cáo định kỳ" },
  "/settings": { title: "Cài đặt hệ thống", desc: "Cấu hình tài khoản và thông báo" },
};

export function Topbar() {
  const pathname = usePathname();
  const info = titles[pathname] || { title: "RiceGuard", desc: "Nền tảng an ninh mạng" };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <div className="flex-1">
        <h2 className="text-base font-semibold tracking-tight">{info.title}</h2>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-primary" />
          {info.desc}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 w-80 focus-within:border-primary/50 transition">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Tìm kiếm cảnh báo, log..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent transition">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger animate-pulse-glow" />
      </button>
    </header>
  );
}
