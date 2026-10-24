"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Settings, ShieldCheck } from "lucide-react";
import { useApiData } from "@/hooks/use-api-data";

const labels: Record<string, string> = {
  dashboard: "Tổng quan",
  threats: "Mối đe dọa",
  alerts: "Cảnh báo",
  investigations: "Điều tra",
  logs: "Nhật ký",
  assets: "Tài sản",
  fields: "Vùng canh tác",
  reports: "Báo cáo",
  playbooks: "Playbooks",
  automation: "Tự động hóa",
  compliance: "Tuân thủ",
  settings: "Cài đặt",
  admin: "Quản trị",
  users: "Người dùng",
  visitors: "Người truy cập",
  system: "Hệ thống",
  audit: "Audit log",
  farmer: "Nông dân",
  cyber: "Nông nghiệp",
};

function breadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment) => labels[segment] || segment.replace(/-/g, " "));
}

interface TopbarProps {
  onMenu?: () => void;
}

export function Topbar({ onMenu }: TopbarProps) {
  const pathname = usePathname();
  const parts = breadcrumb(pathname);
  const health = useApiData<{ status: string }>("/health", { pollMs: 30000 });
  const online = health.data?.status === "ok" && !health.error;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onMenu}
        aria-label="Mở menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Link href="/dashboard" className="shrink-0 font-semibold text-muted-foreground transition hover:text-foreground">
          RiceGuard
        </Link>
        {parts.map((part, index) => (
          <span key={`${part}-${index}`} className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className={index === parts.length - 1 ? "truncate font-medium" : "truncate text-muted-foreground"}>{part}</span>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${online ? "bg-success" : "bg-danger"} opacity-60`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${online ? "bg-success" : "bg-danger"}`} />
          </span>
          <ShieldCheck className={`h-3.5 w-3.5 ${online ? "text-success" : "text-danger"}`} />
          {online ? "Hệ thống trực tuyến" : "Mất kết nối"}
        </div>

        <Link
          href="/alerts"
          aria-label="Xem cảnh báo"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
        </Link>

        <Link
          href="/settings"
          aria-label="Cài đặt"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
