"use client";
import { motion } from "framer-motion";
import { Sparkles, Target, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

interface AISummaryCardProps {
  data: {
    summary: string;
    top_threat: {
      ip: string;
      type: string;
      severity: string;
      description: string;
    };
    affected_targets: string[];
    recommendation: string;
    risk_level: string;
    alert_count: number;
    threats_count: number;
    investigations_count: number;
    created_at: string;
  };
}

const riskColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
};

export default function AISummaryCard({ data }: AISummaryCardProps) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">🤖 AI Summary</h3>
            <p className="text-xs text-slate-400">SOC Copilot · Phân tích tự động</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskColors[data.risk_level] || riskColors.medium}`}>
          {data.risk_level?.toUpperCase()}
        </span>
      </div>

      {/* Summary */}
      <p className="text-slate-200 mb-6 leading-relaxed">{data.summary}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <AlertTriangle className="w-3 h-3" />
            Alerts
          </div>
          <p className="text-2xl font-bold text-white">{data.alert_count}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Target className="w-3 h-3" />
            Threats
          </div>
          <p className="text-2xl font-bold text-white">{data.threats_count}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Investigations
          </div>
          <p className="text-2xl font-bold text-white">{data.investigations_count}</p>
        </div>
      </div>

      {/* Top Threat */}
      {data.top_threat && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-2">
            <Target className="w-3 h-3" />
            🎯 TOP THREAT
          </div>
          <p className="font-bold text-white mb-1">
            {data.top_threat.type} - <span className="font-mono">{data.top_threat.ip}</span>
          </p>
          <p className="text-sm text-slate-300">{data.top_threat.description}</p>
        </div>
      )}

      {/* Recommendation */}
      {data.recommendation && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
            <Lightbulb className="w-3 h-3" />
            💡 KHUYẾN NGHỊ
          </div>
          <p className="text-sm text-slate-200">{data.recommendation}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
        <span>Window: {data.time_window}</span>
        <span>Cập nhật: {new Date(data.created_at).toLocaleTimeString("vi-VN")}</span>
      </div>
    </motion.div>
  );
}
