"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Play, Pause, RefreshCw, Settings2, Activity, Clock, CheckCircle,
  XCircle, Workflow, Radio, Users
} from "lucide-react";
import api from "@/lib/api";

interface WorkflowItem {
  id: number;
  workflow_id: string;
  name: string;
  description: string;
  owner: string;
  trigger_type: string;
  status: string;
  last_run: string;
  execution_count: number;
  success_rate: number;
}

const statusColor: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  paused: "bg-warning/10 text-warning border-warning/30",
  error: "bg-danger/10 text-danger border-danger/30",
};

const statusLabel: Record<string, string> = {
  active: "Đang chạy",
  paused: "Tạm dừng",
  error: "Lỗi",
};

const ownerColor: Record<string, string> = {
  "Bích Trâm": "gradient-primary",
  "Tống Mỹ Trà": "gradient-cyber",
  "Trần Anh Tuấn": "gradient-success",
  "Hữu Thuận": "gradient-warning",
};

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("/workflows", { params: { status: filter === "all" ? "" : filter } }),
      api.get("/workflows/stats"),
    ])
      .then(([w, s]) => {
        setWorkflows(w.data.data);
        setStats(s.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleToggle = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/workflows/${id}/toggle`);
      fetchData();
    } catch (e) {
      window.alert("Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRun = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/workflows/${id}/run`);
      fetchData();
    } catch (e) {
      window.alert("Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng luồng", value: stats?.total ?? 0, icon: Workflow, color: "gradient-primary" },
          { label: "Đang chạy", value: stats?.active ?? 0, icon: CheckCircle, color: "gradient-success" },
          { label: "Tạm dừng", value: stats?.paused ?? 0, icon: Pause, color: "gradient-warning" },
          { label: "Lỗi", value: stats?.errors ?? 0, icon: XCircle, color: "gradient-danger" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">{workflows.length} luồng tự động hóa n8n</h3>
            <p className="text-xs text-muted-foreground">
              Tổng {Number(stats?.totalExecutions || 0).toLocaleString()} lần thực thi
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {[
            { id: "all", label: "Tất cả" },
            { id: "active", label: "Đang chạy" },
            { id: "paused", label: "Tạm dừng" },
            { id: "error", label: "Lỗi" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                filter === f.id
                  ? "gradient-primary text-white glow"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium hover:bg-accent transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-muted-foreground">Đang tải...</div>
        ) : workflows.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-muted-foreground">Không có workflow</div>
        ) : (
          workflows.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover-lift rounded-2xl border border-border bg-card p-5 group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ownerColor[w.owner] || "gradient-primary"} glow shrink-0 group-hover:scale-110 transition`}>
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground">WF-{String(w.id).padStart(2, "0")}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor[w.status]}`}>
                      {statusLabel[w.status]}
                    </span>
                  </div>
                  <h4 className="font-semibold truncate">{w.name}</h4>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">{w.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Trigger</p>
                  <p className="font-medium flex items-center gap-1 mt-0.5">
                    <Radio className="h-3 w-3 text-primary" />
                    {w.trigger_type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Owner</p>
                  <p className="font-medium mt-0.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {w.owner}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-medium mt-0.5">{(w.execution_count || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success</p>
                  <p className={`font-medium mt-0.5 ${Number(w.success_rate) >= 99 ? "text-success" : Number(w.success_rate) >= 95 ? "text-warning" : "text-danger"}`}>
                    {w.success_rate}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {w.last_run ? new Date(w.last_run).toLocaleString("vi-VN") : "Chưa chạy"}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRun(w.id)}
                    disabled={actionLoading === w.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition disabled:opacity-50"
                    title="Chạy ngay"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(w.id)}
                    disabled={actionLoading === w.id}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50 ${
                      w.status === "active"
                        ? "text-warning hover:bg-warning/10"
                        : "text-success hover:bg-success/10"
                    }`}
                    title={w.status === "active" ? "Tạm dừng" : "Bật"}
                  >
                    {w.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
