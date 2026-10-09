"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Plus, Leaf, Layers, TrendingUp, X, ChevronRight,
  Satellite, Calendar, Award, Sprout, Search, Filter
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import FieldMap from "@/components/farmer/FieldMap";
import SatelliteAnalysis from "@/components/farmer/SatelliteAnalysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Field {
  id: number;
  name: string;
  area_hectare: number;
  location: string;
  status: string;
  coordinates?: { lat: number; lng: number };
}

interface Plot {
  id: number;
  field_id: number;
  name: string;
  area_hectare: number;
  rice_variety: string;
  season: string;
  status: string;
}

interface Season {
  id: number;
  field_id: number;
  name: string;
  rice_variety: string;
  yield_kg: number;
  profit_vnd: number;
}

const statusConfig: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  dang_canh_tac: { label: "Đang canh tác", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
  thu_hoach: { label: "Thu hoạch", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
  nghi_dat: { label: "Đất nghỉ", text: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", dot: "bg-slate-400" },
  ngap_lu: { label: "Ngập lũ", text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", dot: "bg-blue-400" },
};

export default function FarmerFieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "grid">("grid");
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [f, p, s] = await Promise.all([
          axios.get(`${API_URL}/api/fields`, { headers }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_URL}/api/plots`, { headers }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_URL}/api/seasons`, { headers }).catch(() => ({ data: { data: [] } })),
        ]);
        setFields(f.data.data || []);
        setPlots(p.data.data || []);
        setSeasons(s.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredFields = fields.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  const totalArea = fields.reduce((s, f) => s + Number(f.area_hectare || 0), 0);
  const totalYield = seasons.reduce((s, x) => s + Number(x.yield_kg || 0), 0);
  const totalProfit = seasons.reduce((s, x) => s + Number(x.profit_vnd || 0), 0);
  const activeCount = fields.filter((f) => f.status === "dang_canh_tac").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sprout className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vùng canh tác</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quản lý vùng trồng lúa và theo dõi hiệu suất mùa vụ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm vùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:border-emerald-500/50 transition"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
              title="Danh sách"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded-md transition ${viewMode === "map" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
              title="Bản đồ"
            >
              <Satellite className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => toast.info("Chức năng đang phát triển")}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> Thêm vùng
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Tổng vùng" value={fields.length} sub={`${activeCount} đang canh tác`} />
        <StatCard icon={MapPin} label="Diện tích" value={totalArea.toFixed(1)} unit="ha" sub="Tổng diện tích" />
        <StatCard icon={Leaf} label="Sản lượng" value={(totalYield / 1000).toFixed(1)} unit="tấn" sub={`${seasons.length} mùa vụ`} />
        <StatCard icon={TrendingUp} label="Lợi nhuận" value={(totalProfit / 1000000).toFixed(0)} unit="M" sub="VNĐ tích lũy" highlight />
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <div className="space-y-4">
          <FieldMap fields={filteredFields} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                plots={plots.filter((p) => p.field_id === field.id)}
                seasons={seasons.filter((s) => s.field_id === field.id)}
                onClick={() => setSelectedField(field)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              plots={plots.filter((p) => p.field_id === field.id)}
              seasons={seasons.filter((s) => s.field_id === field.id)}
              onClick={() => setSelectedField(field)}
            />
          ))}
        </div>
      )}

      {filteredFields.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold">Không tìm thấy vùng nào</p>
          <p className="text-sm text-muted-foreground mt-1">Thử tìm từ khóa khác</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedField && (
          <FieldModal
            field={selectedField}
            plots={plots.filter((p) => p.field_id === selectedField.id)}
            seasons={seasons.filter((s) => s.field_id === selectedField.id)}
            onClose={() => setSelectedField(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function StatCard({ icon: Icon, label, value, unit, sub, highlight }: any) {
  return (
    <div className={`rounded-2xl border p-4 transition ${
      highlight
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-card"
        : "border-border bg-card"
    }`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold ${highlight ? "text-emerald-400" : ""}`}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function FieldCard({ field, plots, seasons, onClick }: any) {
  const cfg = statusConfig[field.status] || statusConfig.dang_canh_tac;
  const latest = seasons[0];

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-emerald-500/40 transition-all group"
    >
      {/* Header */}
      <div className="relative p-4 pb-3 border-b border-border/50">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Leaf className="h-5 w-5 text-emerald-400" />
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${cfg.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-[10px] font-bold ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>
        <h3 className="font-bold text-base leading-tight group-hover:text-emerald-400 transition">
          {field.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {field.location}
        </p>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Diện tích</p>
            <p className="text-sm font-bold text-emerald-400">{field.area_hectare}<span className="text-[10px] text-muted-foreground ml-0.5">ha</span></p>
          </div>
          <div className="text-center border-x border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Thửa</p>
            <p className="text-sm font-bold">{plots.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mùa vụ</p>
            <p className="text-sm font-bold">{seasons.length}</p>
          </div>
        </div>

        {/* Latest season */}
        {latest && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Vụ gần nhất</span>
              <span className="text-[10px] text-muted-foreground">{latest.rice_variety}</span>
            </div>
            <p className="text-xs font-semibold truncate">{latest.name}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] font-bold text-emerald-400">
                {Number(latest.yield_kg).toLocaleString()} kg
              </span>
              <span className="text-[11px] font-bold text-amber-400">
                +{(Number(latest.profit_vnd) / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

function FieldModal({ field, plots, seasons, onClose }: any) {
  const cfg = statusConfig[field.status] || statusConfig.dang_canh_tac;
  const totalProfit = seasons.reduce((s: number, x: any) => s + Number(x.profit_vnd), 0);
  const totalYield = seasons.reduce((s: number, x: any) => s + Number(x.yield_kg), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md p-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sprout className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Vùng canh tác</p>
                <h2 className="text-xl font-bold">{field.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {field.location}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={`inline-flex items-center gap-1.5 mt-3 rounded-full border px-2.5 py-1 ${cfg.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            <span className={`text-[10px] font-bold ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Diện tích" value={`${field.area_hectare}`} unit="ha" />
            <MiniStat label="Số thửa" value={plots.length} />
            <MiniStat label="Sản lượng" value={(totalYield / 1000).toFixed(1)} unit="tấn" />
            <MiniStat label="Lợi nhuận" value={`${(totalProfit / 1000000).toFixed(0)}`} unit="M" highlight />
          </div>

          {/* Plots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                Danh sách thửa
              </h3>
              <span className="text-xs text-muted-foreground">{plots.length} thửa</span>
            </div>
            {plots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center">
                <p className="text-xs text-muted-foreground">Chưa có thửa nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {plots.map((plot: any) => (
                  <div key={plot.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/20 hover:bg-accent/30 transition border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Leaf className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{plot.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {plot.rice_variety} · {plot.season} · {plot.area_hectare} ha
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      plot.status === "growing" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                      plot.status === "harvesting" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                      "bg-slate-500/10 text-slate-400 border-slate-500/30"
                    }`}>
                      {plot.status === "growing" ? "Đang trồng" : plot.status === "harvesting" ? "Thu hoạch" : plot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seasons */}
          {seasons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Lịch sử mùa vụ
                </h3>
                <span className="text-xs text-muted-foreground">{seasons.length} vụ</span>
              </div>
              <div className="space-y-2">
                {seasons.map((season: any) => (
                  <div key={season.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{season.name}</p>
                        <p className="text-[11px] text-muted-foreground">{season.rice_variety}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        {Number(season.yield_kg).toLocaleString()} kg
                      </p>
                      <p className="text-[11px] text-amber-400 font-semibold">
                        +{(Number(season.profit_vnd) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Satellite */}
          {field.coordinates?.lat && (
            <SatelliteAnalysis
              fieldName={field.name}
              lat={field.coordinates.lat}
              lng={field.coordinates.lng}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ label, value, unit, highlight }: any) {
  return (
    <div className={`rounded-xl border p-3 ${
      highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-accent/20"
    }`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${highlight ? "text-emerald-400" : ""}`}>{value}</span>
        {unit && <span className="text-[10px] text-muted-foreground font-medium">{unit}</span>}
      </div>
    </div>
  );
}
