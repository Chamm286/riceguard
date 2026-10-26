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
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur md:px-5">
      <button
        onClick={onMenu}
        aria-label="Mở menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <Link href="/dashboard" className="shrink-0 text-muted-foreground transition hover:text-foreground">
          RiceGuard
        </Link>
        {parts.map((part, index) => (
          <span key={`${part}-${index}`} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <span className={index === parts.length - 1 ? "truncate font-medium text-foreground" : "truncate text-muted-foreground"}>{part}</span>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden items-center gap-1.5 px-2 text-[11px] text-muted-foreground sm:flex">
          <ShieldCheck className={`h-3.5 w-3.5 ${online ? "text-success" : "text-danger"}`} />
          <span>{online ? "Trực tuyến" : "Mất kết nối"}</span>
        </div>

        <Link
          href="/alerts"
          aria-label="Xem cảnh báo"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </Link>

        <Link
          href="/settings"
          aria-label="Cài đặt"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
