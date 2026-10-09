"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin, AlertTriangle, Leaf, Satellite, TrendingUp, Radar, Shield, Activity, Signal, Wifi } from "lucide-react";
import api from "@/lib/api";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), { ssr: false });

interface Field {
  id: number;
  name: string;
  location: string;
  area_hectare: number;
  owner_name?: string;
  active_alerts: number;
  status: string;
}

const fieldCoords: Record<number, [number, number]> = {
  1: [10.45, 105.63],
  2: [10.35, 105.72],
  3: [16.05, 108.22],
  4: [15.95, 108.25],
  5: [10.85, 105.45],
  6: [10.5, 105.6],
  7: [10.4, 105.7],
  8: [16.0, 108.2],
};

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.get("/fields").then((r) => setFields(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Vùng canh tác", value: fields.length, icon: Leaf, color: "gradient-primary" },
          { label: "Tổng hecta", value: fields.reduce((s, f) => s + Number(f.area_hectare), 0).toFixed(1), icon: Satellite, color: "gradient-cyber" },
          { label: "Cảnh báo", value: fields.reduce((s, f) => s + (f.active_alerts || 0), 0), icon: AlertTriangle, color: "gradient-warning" },
          { label: "Sức khỏe TB", value: "98%", icon: TrendingUp, color: "gradient-success" },
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

      {/* Map */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow">
              <Radar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Bản đồ giám sát</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Đang theo dõi realtime
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-success/10 border border-success/30 px-3 py-1 text-[10px] font-medium text-success flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              {fields.length} điểm online
            </span>
          </div>
        </div>

        <div className="h-[500px] relative">
          {mounted && (
            <MapContainer
              center={[12.5, 107]}
              zoom={6}
              style={{ height: "100%", width: "100%", background: "#e8f0eb" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {fields.map((f) => {
                const coord = fieldCoords[f.id] || [10.45, 105.63];
                return (
                  <div key={f.id}>
                    <Circle
                      center={coord as [number, number]}
                      radius={8000}
                      pathOptions={{
                        color: f.active_alerts > 0 ? "#ef4444" : "#10b981",
                        fillColor: f.active_alerts > 0 ? "#ef4444" : "#10b981",
                        fillOpacity: 0.15,
                        weight: 1,
                      }}
                    />
                    <Marker position={coord as [number, number]}>
                      <Popup>
                        <div style={{ fontSize: 13, minWidth: 180 }}>
                          <strong style={{ color: "#10b981" }}>{f.name}</strong>
                          <br />📍 {f.location}
                          <br />📐 {f.area_hectare} ha
                          <br />⚠️ {f.active_alerts} cảnh báo
                          <br />👤 {f.owner_name || "-"}
                        </div>
                      </Popup>
                    </Marker>
                  </div>
                );
              })}
            </MapContainer>
          )}

          {/* HUD overlays */}
          <div className="pointer-events-none absolute top-4 left-4 glass rounded-xl p-3 z-[400]">
            <div className="flex items-center gap-2 text-xs">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono">SYS: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Activity className="h-3.5 w-3.5 text-success" />
              <span className="font-mono">SCAN: 100%</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Wifi className="h-3.5 w-3.5 text-cyber" />
              <span className="font-mono">SAT: ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {fields.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="hover-lift rounded-2xl border border-border bg-card p-5 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow group-hover:scale-110 transition">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              {f.active_alerts > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-danger/10 border border-danger/30 px-2.5 py-0.5 text-[10px] font-semibold text-danger">
                  <AlertTriangle className="h-3 w-3" />
                  {f.active_alerts}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg">{f.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {f.location}
            </p>
            <div className="mt-5 pt-4 border-t border-border flex justify-between text-xs">
              <div>
                <p className="text-muted-foreground">Diện tích</p>
                <p className="font-semibold text-base mt-0.5">
                  {f.area_hectare} <span className="text-xs text-muted-foreground">ha</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Chủ sở hữu</p>
                <p className="font-semibold mt-0.5">{f.owner_name || "-"}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
