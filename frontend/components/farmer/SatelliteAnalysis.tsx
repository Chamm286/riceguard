"use client";
import { useState } from "react";
import { Satellite, Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface SatelliteResult {
  dien_tich: string;
  mau_sac: string;
  mat_do: string;
  tinh_trang: string;
  bat_thuong: string;
  khuyen_nghi: string;
  ai_full: string;
}

interface Props {
  fieldName: string;
  lat: number;
  lng: number;
}

export default function SatelliteAnalysis({ fieldName, lat, lng }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SatelliteResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/satellite/analyze`,
        { lat, lng, zoom: 16, field_name: fieldName },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 90000 }
      );
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.message || "Lỗi phân tích");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Satellite className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm">Phân tích vệ tinh AI</p>
            <p className="text-[10px] text-muted-foreground font-normal">Gemini Vision phân tích ảnh vệ tinh</p>
          </div>
        </h3>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg gradient-primary text-white px-3 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-lg glow"
        >
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang phân tích...</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" /> Phân tích ngay</>
          )}
        </button>
      </div>

      {loading && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Đang tải ảnh vệ tinh và phân tích bằng AI...</p>
          <p className="text-[10px] text-muted-foreground mt-1">Có thể mất 30-60 giây</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Phân tích hoàn tất
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-accent/30 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Diện tích</p>
              <p className="font-bold text-primary text-sm">{result.dien_tich || "—"}</p>
            </div>
            <div className="rounded-xl bg-accent/30 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Màu sắc</p>
              <p className="font-bold text-sm">{result.mau_sac || "—"}</p>
            </div>
            <div className="rounded-xl bg-accent/30 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mật độ</p>
              <p className="font-bold text-sm">{result.mat_do || "—"}</p>
            </div>
            <div className="rounded-xl bg-accent/30 border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tình trạng</p>
              <p className="font-bold text-sm">{result.tinh_trang || "—"}</p>
            </div>
          </div>

          {result.bat_thuong && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold mb-1">⚠️ Bất thường</p>
              <p className="text-xs">{result.bat_thuong}</p>
            </div>
          )}

          {result.khuyen_nghi && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-green-400 font-bold mb-1">💡 Khuyến nghị</p>
              <p className="text-xs leading-relaxed">{result.khuyen_nghi}</p>
            </div>
          )}
        </div>
      )}

      {!loading && !result && !error && (
        <div className="rounded-xl bg-accent/20 border border-dashed border-border/50 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Click <strong className="text-primary">"Phân tích ngay"</strong> để AI phân tích ảnh vệ tinh vùng này
          </p>
        </div>
      )}
    </div>
  );
}
