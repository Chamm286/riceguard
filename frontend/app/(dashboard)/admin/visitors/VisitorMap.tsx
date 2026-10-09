"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface GeoIP {
  ip_address: string;
  country?: string;
  country_name?: string;
  city?: string;
  latitude?: number | string;
  longitude?: number | string;
  isp?: string;
  hits: number;
}

// 3 loại tile bản đồ
const TILES = {
  satellite: {
    name: "🛰️ Vệ tinh",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  terrain: {
    name: "🏔️ Địa hình",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
    subdomains: "abc",
    maxZoom: 17,
  },
  street: {
    name: "🗺️ Đường phố",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19,
  },
};

export default function VisitorMap({ geoIPs }: { geoIPs: GeoIP[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [tileType, setTileType] = useState<keyof typeof TILES>("satellite");

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      // Fix icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        if ((containerRef.current as any)._leaflet_id) {
          delete (containerRef.current as any)._leaflet_id;
        }
        containerRef.current.innerHTML = "";

        const map = L.map(containerRef.current, {
          center: [16.047079, 108.206230],
          zoom: 3,
          minZoom: 2,
          maxZoom: 18,
          worldCopyJump: true,
        });
        mapInstanceRef.current = map;
      }

      // Đổi tile khi user chọn
      const currentTile = TILES[tileType];
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      tileLayerRef.current = L.tileLayer(currentTile.url, {
        attribution: currentTile.attribution,
        subdomains: currentTile.subdomains || "abc",
        maxZoom: currentTile.maxZoom,
      }).addTo(mapInstanceRef.current);

      // Markers layer
      if (!markersLayerRef.current) {
        markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      } else {
        markersLayerRef.current.clearLayers();
      }

      const markers: any[] = [];
      geoIPs.forEach((g) => {
        const lat = Number(g.latitude);
        const lon = Number(g.longitude);
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

        // Marker icon tùy severity
        const marker = L.marker([lat, lon]);
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 240px; color: #111827; background: #ffffff; padding: 4px;">
            <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
              🌐 ${g.ip_address}
            </div>
            <div style="font-size: 13px; margin-bottom: 5px; color: #374151;">
              📍 <b>${g.city || "?"}</b>, ${g.country_name || g.country || "?"}
            </div>
            <div style="font-size: 13px; margin-bottom: 5px; color: #374151;">
              📡 <b>ISP:</b> ${g.isp || "?"}
            </div>
            <div style="font-size: 13px; color: #374151;">
              👁 <b>Hits:</b> ${g.hits}
            </div>
          </div>
        `);
        marker.addTo(markersLayerRef.current);
        markers.push(marker);
      });

      if (markers.length > 0 && mapInstanceRef.current) {
        const group = L.featureGroup(markers);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.3), { maxZoom: 5 });
      }
    };

    init();
    return () => { cancelled = true; };
  }, [geoIPs, tileType]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Tile switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 rounded-xl border border-border bg-card/95 backdrop-blur p-1 shadow-lg">
        {(Object.keys(TILES) as Array<keyof typeof TILES>).map((key) => (
          <button
            key={key}
            onClick={() => setTileType(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tileType === key
                ? "gradient-primary text-white"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {TILES[key].name}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          height: "600px",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#0a0a0a",
        }}
      />
    </div>
  );
}
