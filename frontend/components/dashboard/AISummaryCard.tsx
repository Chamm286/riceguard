"use client";
import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import type { AISummary } from "@/lib/ai-summary";

interface AISummaryCardProps {
  data: AISummary;
}

const riskStyles: Record<string, string> = {
  low: "border-success/30 bg-success/10 text-success",
  medium: "border-warning/30 bg-warning/10 text-warning",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-500",
  critical: "border-danger/30 bg-danger/10 text-danger",
};

const riskLabels: Record<string, string> = {
  low: "Rủi ro thấp",
  medium: "Rủi ro trung bình",
  high: "Rủi ro cao",
  critical: "Rủi ro nghiêm trọng",
};

export default function AISummaryCard({ data }: AISummaryCardProps) {
  if (!data) return null;

  const risk = (data.risk_level || "medium").toLowerCase();
  const summary = data.alert_count
    ? `Trong ${data.time_window || "24 giờ"} qua, hệ thống ghi nhận ${data.alert_count} cảnh báo, ${data.threats_count} mối đe dọa và ${data.investigations_count} điều tra đang được theo dõi.`
    : `Trong ${data.time_window || "24 giờ"} qua, hệ thống chưa ghi nhận cảnh báo mới.`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Tóm tắt SOC</h3>
            <p className="text-xs text-muted-foreground">SOC Copilot · Phân tích tự động</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${riskStyles[risk] || riskStyles.medium}`}>
          {riskLabels[risk] || riskLabels.medium}
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">{summary}</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-accent/30 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="h-3 w-3" /> Cảnh báo
          </div>
          <p className="text-xl font-semibold">{data.alert_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-accent/30 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Target className="h-3 w-3" /> Mối đe dọa
          </div>
          <p className="text-xl font-semibold">{data.threats_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-accent/30 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Điều tra
          </div>
          <p className="text-xl font-semibold">{data.investigations_count}</p>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${data.top_threat ? "lg:grid-cols-2" : ""}`}>
        {data.top_threat && (
          <div className="rounded-xl border border-danger/25 bg-danger/5 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-danger">
              <Target className="h-3 w-3" /> Mối đe dọa nổi bật
            </div>
            <p className="text-sm font-medium">
              {data.top_threat.type} · <span className="font-mono text-xs">{data.top_threat.ip}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{data.top_threat.description}</p>
          </div>
        )}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Lightbulb className="h-3 w-3" /> Khuyến nghị
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {data.recommendation || "Duy trì giám sát, rà soát cảnh báo mức cao và kiểm tra các IP bất thường trong 24 giờ gần nhất."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-success" />
          Cửa sổ phân tích: {data.time_window || "24h"}
        </span>
        <span>Cập nhật: {new Date(data.created_at).toLocaleString("vi-VN")}</span>
      </div>
    </motion.section>
  );
}
