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
  low: "Rủi ro 24h thấp",
  medium: "Rủi ro 24h trung bình",
  high: "Rủi ro 24h cao",
  critical: "Rủi ro 24h nghiêm trọng",
};

export default function AISummaryCard({ data }: AISummaryCardProps) {
  if (!data) return null;

  const risk = (data.risk_level || "medium").toLowerCase();
  const summary = data.alert_count
    ? `Trong ${data.time_window || "24 giờ"} qua, hệ thống ghi nhận ${data.alert_count} cảnh báo, ${data.threats_count} mối đe dọa và ${data.investigations_count} điều tra đang được theo dõi.`
    : `Trong ${data.time_window || "24 giờ"} qua, hệ thống chưa ghi nhận cảnh báo mới.`;
  const topThreat = data.top_threat;
  const hasTopThreat = Boolean(
    topThreat &&
    topThreat.type &&
    topThreat.type !== "N/A" &&
    topThreat.ip &&
    topThreat.ip !== "N/A"
  );
  const recommendation = data.recommendation && !/^không có/i.test(data.recommendation)
    ? data.recommendation
    : "Duy trì giám sát, rà soát cảnh báo mức cao và kiểm tra các IP bất thường trong 24 giờ gần nhất.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Tóm tắt SOC</h3>
          <span className="text-[11px] text-muted-foreground">· SOC Copilot</span>
        </div>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${riskStyles[risk] || riskStyles.medium}`}>
          {riskLabels[risk] || riskLabels.medium}
        </span>
      </div>

      <div className={`grid gap-5 p-5 ${hasTopThreat ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
        <div>
          <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">{summary}</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-md border border-border bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <AlertTriangle className="h-3 w-3" /> Cảnh báo
              </div>
              <p className="mt-1 text-lg font-semibold leading-none">{data.alert_count}</p>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Target className="h-3 w-3" /> Mối đe dọa
              </div>
              <p className="mt-1 text-lg font-semibold leading-none">{data.threats_count}</p>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> Điều tra
              </div>
              <p className="mt-1 text-lg font-semibold leading-none">{data.investigations_count}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {hasTopThreat && (
            <div className="rounded-md border border-danger/20 bg-danger/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-danger">
                <Target className="h-3 w-3" /> Mối đe dọa nổi bật
              </div>
              <p className="text-xs font-medium">
                {topThreat?.type} <span className="font-mono text-muted-foreground">{topThreat?.ip}</span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{topThreat?.description}</p>
            </div>
          )}
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-primary">
              <Lightbulb className="h-3 w-3" /> Khuyến nghị
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-2.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-success" />
          Cửa sổ phân tích: {data.time_window || "24h"}
        </span>
        <span>Cập nhật: {new Date(data.created_at).toLocaleString("vi-VN")}</span>
      </div>
    </motion.section>
  );
}
