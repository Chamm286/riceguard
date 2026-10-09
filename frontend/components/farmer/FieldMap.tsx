"use client";
import { useEffect, useState } from "react";

interface Field {
  id: number;
  name: string;
  location: string;
  area_hectare: number;
  status: string;
  coordinates?: { lat: number; lng: number };
}

export default function FieldMap({ fields }: { fields: Field[] }) {
  const [MapComp, setMapComp] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([RL, L]) => {
      if (!mounted) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const MapWrapper = () => {
        const { MapContainer, TileLayer, Marker, Popup } = RL;
        const center: [number, number] = [10.3, 105.5];
        const validFields = fields.filter((f) => f.coordinates?.lat);

        return (
          <MapContainer
            center={center}
            zoom={9}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution="&copy; Google Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              opacity={0.6}
            />
            {validFields.map((field) => (
              <Marker
                key={field.id}
                position={[field.coordinates!.lat, field.coordinates!.lng]}
              >
                <Popup>
                  <div style={{ fontSize: 13, minWidth: 180 }}>
                    <strong style={{ fontSize: 14 }}>{field.name}</strong>
                    <div style={{ marginTop: 6, color: "#666" }}>📍 {field.location}</div>
                    <div style={{ color: "#666" }}>📏 {field.area_hectare} ha</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        );
      };

      setMapComp(() => MapWrapper);
    });

    return () => { mounted = false; };
  }, [fields]);

  if (!MapComp) {
    return (
      <div className="h-[480px] rounded-2xl border border-border/50 bg-card flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
      </div>
    );
  }

  return (
    <div className="h-[480px] rounded-2xl border border-border/50 overflow-hidden shadow-sm">
      <MapComp />
    </div>
  );
}
