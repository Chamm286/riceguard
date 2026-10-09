"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import {
  ArrowLeft, ShieldAlert, MapPin, CheckCircle, Ban, Send, Fingerprint,
  Activity, FileText, Play, Zap, MessageSquare, User as UserIcon,
  Server, Globe, Clock
} from "lucide-react";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  alert_type: string;
  field_name?: string;
  field_location?: string;
  lead_time_minutes: number;
  created_at: string;
}

const severityColor: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-danger/10 text-danger border-danger/30",
};

const statusColor: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/30",
  processing: "bg-warning/10 text-warning border-warning/30",
  resolved: "bg-success/10 text-success border-success/30",
  ignored: "bg-muted text-muted-foreground border-border",
};

function extractIP(text: string): string {
  if (!text) return "";
  const match = text.match(/\d+\.\d+\.\d+\.\d+/);
  return match ? match[0] : "";
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAlert = () => {
    api.get(`/alerts/${id}`)
      .then((r) => setAlert(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlert(); }, [id]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await api.put(`/alerts/${id}/status`, { status, note: note || undefined });
      setNote("");
      fetchAlert();
    } catch (e) {
      alert("Có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockIP = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const ip = extractIP(alert?.description || "") || "unknown";
    setNote((n) => (n ? n + "\n" : "") + `[SYSTEM] Đã block IP ${ip} thành công lúc ${new Date().toLocaleTimeString("vi-VN")}`);
    setActionLoading(false);
  };

  const handleAssign = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setNote((n) => (n ? n + "\n" : "") + "[SYSTEM] Đã assign cho analyst Tống Mỹ Trà");
    setActionLoading(false);
  };

  const handleNotify = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setNote((n) => (n ? n + "\n" : "") + "[SYSTEM] Đã gửi thông báo Telegram cho admin");
    setActionLoading(false);
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground">Đang tải...</div>;
  if (!alert) return <div className="p-12 text-center text-muted-foreground">Không tìm thấy cảnh báo</div>;

  const attackerIP = extractIP(alert.description) || "unknown";
  const serverIP = "192.168.40.101";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent transition">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground">ALERT-{String(alert.id).padStart(4, "0")}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${severityColor[alert.severity]}`}>{alert.severity}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColor[alert.status]}`}>{alert.status}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{alert.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left - Details */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Info card */}
          <div className={`rounded-2xl border p-6 ${alert.severity === "critical" ? "border-danger/30 bg-danger/5" : "border-border bg-card"}`}>
            <div className="flex items-start gap-4 mb-5">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl shrink-0 ${alert.severity === "critical" ? "gradient-danger" : "gradient-warning"}`}>
                <ShieldAlert className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Mô tả</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
              </div>
            </div>

            {/* Grid info with location */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" /> Phân loại
                </p>
                <p className="text-sm font-medium capitalize">{alert.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Nguồn tấn công
                </p>
                <p className="text-sm font-mono font-medium text-danger">{attackerIP}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Server className="h-3 w-3" /> Máy chủ bị tấn công
                </p>
                <p className="text-sm font-mono font-medium text-primary">{serverIP}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Thời gian
                </p>
                <p className="text-sm font-medium">{new Date(alert.created_at).toLocaleString("vi-VN")}</p>
              </div>
            </div>

            {/* If linked to a field */}
            {alert.field_name && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Vùng canh tác liên quan
                </p>
                <p className="text-sm font-medium">{alert.field_name} — {alert.field_location}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Hành động xử lý</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={handleBlockIP} disabled={actionLoading} className="flex flex-col items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger hover:bg-danger/20 transition disabled:opacity-50">
                <Ban className="h-5 w-5" /><span className="text-xs font-semibold">Block IP</span>
              </button>
              <button onClick={handleAssign} disabled={actionLoading} className="flex flex-col items-center gap-2 rounded-xl border border-cyber/30 bg-cyber/10 p-4 text-cyber hover:bg-cyber/20 transition disabled:opacity-50">
                <UserIcon className="h-5 w-5" /><span className="text-xs font-semibold">Assign</span>
              </button>
              <button onClick={handleNotify} disabled={actionLoading} className="flex flex-col items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning hover:bg-warning/20 transition disabled:opacity-50">
                <Send className="h-5 w-5" /><span className="text-xs font-semibold">Notify</span>
              </button>
              <button onClick={() => updateStatus("resolved")} disabled={actionLoading} className="flex flex-col items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-success hover:bg-success/20 transition disabled:opacity-50">
                <CheckCircle className="h-5 w-5" /><span className="text-xs font-semibold">Xử lý xong</span>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Ghi chú xử lý</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Nhập ghi chú..." className="w-full rounded-xl border border-border bg-input p-3.5 text-sm outline-none focus:border-primary/50 resize-none font-mono" />
              <div className="flex justify-end gap-2">
                <button onClick={() => updateStatus("ignored")} disabled={actionLoading} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition disabled:opacity-50">Bỏ qua</button>
                <button onClick={() => updateStatus("processing")} disabled={actionLoading} className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-white glow hover:opacity-90 transition disabled:opacity-50">
                  <Play className="h-4 w-4" />Bắt đầu xử lý
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Timeline */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Timeline xử lý</h3>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 border border-danger/30"><ShieldAlert className="h-4 w-4 text-danger" /></div>
                  <div className="flex-1 w-px bg-border mt-2" />
                </div>
                <div className="flex-1 pb-5">
                  <p className="text-sm font-medium">Phát hiện</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(alert.created_at).toLocaleString("vi-VN")}</p>
                  <p className="text-xs mt-2 text-muted-foreground">Hệ thống tự động phát hiện từ log Filebeat</p>
                </div>
              </div>
              {alert.status !== "new" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 border border-warning/30"><Fingerprint className="h-4 w-4 text-warning" /></div>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-5">
                    <p className="text-sm font-medium">Đang xử lý</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Đã assign cho analyst</p>
                  </div>
                </div>
              )}
              {alert.status === "resolved" && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 border border-success/30"><CheckCircle className="h-4 w-4 text-success" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Đã xử lý</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sự cố đã được giải quyết</p>
                  </div>
                </div>
              )}
              {note && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/30"><MessageSquare className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ghi chú</p>
                    <pre className="text-xs mt-1 p-2.5 rounded-lg bg-accent/40 font-mono whitespace-pre-wrap">{note}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Thông tin bổ sung</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Loại sự cố</span><span className="font-medium capitalize">{alert.alert_type}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Mức độ</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityColor[alert.severity]}`}>{alert.severity}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Trạng thái</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor[alert.status]}`}>{alert.status}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Nguồn</span><span className="font-mono text-danger">{attackerIP}</span></div>
              <div className="flex justify-between py-2"><span className="text-muted-foreground">Server</span><span className="font-mono text-primary">{serverIP}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
