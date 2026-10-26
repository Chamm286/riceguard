"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export interface GeoPoint {
  ip_address: string;
  country?: string;
  country_name?: string;
  city?: string;
  latitude?: number | string;
  longitude?: number | string;
  hits?: number;
}

export default function ThreatMap({ points }: { points: GeoPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
        if (container._leaflet_id) delete container._leaflet_id;
        containerRef.current.innerHTML = "";
        mapRef.current = L.map(containerRef.current, {
          center: [20, 105],
          zoom: 2,
          minZoom: 2,
          maxZoom: 8,
          zoomControl: false,
          attributionControl: false,
          worldCopyJump: true,
        });
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 16,
          attribution: "Tiles &copy; Esri",
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      layerRef.current?.clearLayers();
      const valid = points.filter((p) => {
        const lat = Number(p.latitude);
        const lon = Number(p.longitude);
        return Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0;
      });

      valid.forEach((p) => {
        const lat = Number(p.latitude);
        const lon = Number(p.longitude);
        const hits = Number(p.hits || 1);
        const radius = Math.min(14, 5 + Math.log2(hits + 1) * 1.6);
        L.circleMarker([lat, lon], {
          radius,
          color: "#ef4444",
          weight: 1,
          fillColor: "#ef4444",
          fillOpacity: 0.45,
        })
          .bindTooltip(
            `<b>${p.ip_address}</b><br/>${p.city || "?"}, ${p.country_name || p.country || "?"}<br/>${hits} hits`,
            { direction: "top", className: "soc-map-tooltip" }
          )
          .addTo(layerRef.current as LayerGroup);
      });

      if (valid.length && mapRef.current) {
        const group = L.featureGroup(valid.map((p) => L.marker([Number(p.latitude), Number(p.longitude)])));
        mapRef.current.fitBounds(group.getBounds().pad(0.35), { maxZoom: 4 });
      }
    };

    init();
    return () => { cancelled = true; };
  }, [points]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative h-full min-h-[240px] w-full overflow-hidden rounded-md border border-border bg-[#07101c]">
      <div ref={containerRef} className="absolute inset-0 z-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(6,11,18,0.55)_100%)]" />
      {points.length === 0 && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-2 bg-background/40 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">GeoIP telemetry</span>
          <p className="text-xs text-muted-foreground">Chưa có IP công khai có tọa độ</p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-3 z-[500] flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        {points.length} điểm nguồn
      </div>
    </div>
  );
}
