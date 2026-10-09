"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Sparkles, Loader2, CheckCircle2, Leaf, Send, X,
  AlertTriangle, Bug, Lightbulb, Camera, History, MapPin,
  Info, TrendingUp, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE = `${API_URL}/api`;

interface AIResult {
  report_id: number;
  tinh_trang: string;
  muc_do: string;
  ten_benh: string;
  khuyen_nghi: string;
  ai_full: string;
}

export default function FarmerUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [note, setNote] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // Chỉ cần ảnh là gửi được
  const canSubmit = !!file && !uploading && !analyzing;

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecentReports((res.data.data || []).slice(0, 3));
      } catch (e) { /* ignore */ }
    };
    loadRecent();
  }, []);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh JPG/PNG");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 10MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Vui lòng chọn ảnh lá lúa");
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      // Tự động tạo tiêu đề nếu chưa có
      const autoTitle = note.trim() || `Báo cáo ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      formData.append("title", autoTitle);
      formData.append("description", symptoms.trim() || "Nông dân gửi ảnh để AI phân tích");
      formData.append("image", file);

      const res = await axios.post(`${API_BASE}/reports`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const reportId = res.data.data.id;
      toast.success(`Đã gửi ảnh #${reportId}. AI đang phân tích...`);
      setUploading(false);
      setAnalyzing(true);

      // Poll DB mỗi 3s, tối đa 40 lần (120 giây)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const detail = await axios.get(`${API_BASE}/reports/${reportId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const r = detail.data.data;

          if (r.ai_analysis && r.ai_severity) {
            clearInterval(poll);
            const parts = (r.ai_analysis || "").split("|").map((s: string) => s.trim());
            setResult({
              report_id: reportId,
              tinh_trang: parts[0] || "Không xác định",
              muc_do: r.ai_severity || "Không xác định",
              ten_benh: r.ai_disease || "Không có",
              khuyen_nghi: parts[3] || "Vui lòng thử lại",
              ai_full: r.ai_analysis || "",
            });
            setAnalyzing(false);
            toast.success("AI đã phân tích xong!");
          }

          if (attempts >= 40) {
            clearInterval(poll);
            setAnalyzing(false);
            toast.error("AI xử lý quá lâu. Vui lòng thử lại.");
          }
        } catch (e) { /* ignore */ }
      }, 3000);
    } catch (err: any) {
      setUploading(false);
      toast.error(err.response?.data?.message || "Upload thất bại");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview("");
    setNote("");
    setSymptoms("");
    setResult(null);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-success glow">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chẩn đoán sức khỏe lúa</h1>
            <p className="text-sm text-muted-foreground">
              Chỉ cần gửi ảnh — AI Gemini tự phân tích bệnh trong 10-20 giây
            </p>
          </div>
        </div>
      </motion.div>

      {/* Guide banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3"
      >
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-primary">Hướng dẫn nhanh</p>
          <p className="text-muted-foreground mt-1">
            1. Chụp ảnh lá lúa (cận cảnh, đủ sáng) · 
            2. Gửi ảnh · 
            3. AI Gemini tự phân tích bệnh và đề xuất xử lý
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-border bg-card p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Hình ảnh lá lúa <span className="text-danger">*</span></h2>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}
            className={`relative aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden group ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : preview
                ? "border-primary/50"
                : "border-border hover:border-primary/50"
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition backdrop-blur"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur rounded-lg p-2 text-xs text-white">
                  <p className="font-semibold truncate">{file?.name}</p>
                  <p className="text-[10px] opacity-80">{((file?.size || 0) / 1024).toFixed(1)} KB</p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow group-hover:scale-110 transition">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Kéo thả ảnh lá lúa vào đây</p>
                  <p className="text-xs text-muted-foreground mt-1">hoặc click để chọn file</p>
                </div>
                <p className="text-[10px] text-muted-foreground">JPG · PNG · Tối đa 10MB</p>
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Note (optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              📝 Ghi chú
              <span className="text-[10px] normal-case font-normal text-muted-foreground/70">(không bắt buộc)</span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Ruộng C1, ngày 8/10..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          {/* Symptoms (optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              💬 Triệu chứng quan sát
              <span className="text-[10px] normal-case font-normal text-muted-foreground/70">(không bắt buộc)</span>
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="VD: Đốm nâu, lá vàng từ 3 ngày trước..."
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-3 transition ${
              canSubmit
                ? "gradient-primary text-white shadow-lg glow hover:opacity-90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            }`}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi ảnh...</>
            ) : analyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> AI đang phân tích...</>
            ) : (
              <><Send className="h-4 w-4" /> Gửi ảnh cho AI phân tích</>
            )}
          </button>

          {/* Hint */}
          {!file && !uploading && !analyzing && (
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 p-2.5 text-xs">
              <Info className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              <span className="text-warning">
                Vui lòng chọn ảnh lá lúa để AI phân tích
              </span>
            </div>
          )}
        </motion.div>

        {/* Result area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-border bg-card p-6 min-h-[500px] flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Kết quả phân tích AI</h2>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {!result && !uploading && !analyzing && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
                    <Leaf className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mt-4">Chưa có kết quả</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Gửi ảnh lá lúa — AI sẽ tự chẩn đoán bệnh và đề xuất cách xử lý
                  </p>
                </motion.div>
              )}

              {(uploading || analyzing) && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full gradient-primary blur-2xl opacity-50 animate-pulse" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-5">
                    {uploading ? "Đang gửi ảnh lên..." : "AI Gemini đang chẩn đoán..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Vui lòng đợi 10-20 giây</p>
                  <div className="mt-4 h-1 w-48 rounded-full bg-accent overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="h-full w-1/2 gradient-primary"
                    />
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-success">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Chẩn đoán hoàn tất</p>
                      <p className="text-xs text-muted-foreground">Báo cáo #{result.report_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Leaf} label="Tình trạng" value={result.tinh_trang} color="success" />
                    <InfoCard
                      icon={AlertTriangle}
                      label="Mức độ"
                      value={result.muc_do}
                      color={result.muc_do.includes("cao") ? "danger" : result.muc_do.includes("trung") ? "warning" : "success"}
                    />
                    <InfoCard icon={Bug} label="Bệnh" value={result.ten_benh} color="warning" className="col-span-2" />
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Lightbulb className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-wider">Khuyến nghị xử lý</p>
                    </div>
                    <p className="text-sm leading-relaxed">{result.khuyen_nghi}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-accent py-2.5 text-sm font-semibold hover:bg-accent/80 transition"
                    >
                      📷 Chẩn đoán tiếp
                    </button>
                    <Link
                      href="/farmer/my-reports"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl gradient-primary text-white py-2.5 text-sm font-semibold hover:opacity-90 transition"
                    >
                      <History className="h-4 w-4" /> Lịch sử
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Báo cáo gần đây</h3>
            </div>
            <Link href="/farmer/my-reports" className="text-xs text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentReports.map((r) => (
              <div key={r.id} className="flex gap-3 rounded-xl border border-border p-3 hover:border-primary/50 transition">
                {r.image_url && (
                  <img
                    src={`${API_URL}${r.image_url}`}
                    alt={r.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{r.status}</p>
                  {r.ai_disease && (
                    <p className="text-xs mt-1 text-warning">🦠 {r.ai_disease}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color, className = "" }: any) {
  const colorClass = {
    danger: "text-danger",
    warning: "text-warning",
    success: "text-success",
    primary: "text-primary",
  }[color] || "text-foreground";

  return (
    <div className={`rounded-xl border border-border bg-accent/30 p-3 ${className}`}>
      <div className={`flex items-center gap-1.5 ${colorClass} mb-1`}>
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-sm font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
