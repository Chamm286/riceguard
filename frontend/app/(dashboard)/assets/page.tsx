"use client";
import { motion } from "framer-motion";
import { Server, Database, Wifi, Cpu, HardDrive, Activity, CheckCircle, AlertTriangle, Globe, Shield } from "lucide-react";

const assets = [
  { id: 1, name: "web-server-01", type: "Server", ip: "192.168.1.10", os: "Ubuntu 22.04", status: "online", cpu: 23, ram: 45, disk: 67, uptime: "45 ngày" },
  { id: 2, name: "db-postgres", type: "Database", ip: "192.168.1.20", os: "PostgreSQL 18", status: "online", cpu: 12, ram: 78, disk: 82, uptime: "45 ngày" },
  { id: 3, name: "sensor-field-A1", type: "IoT Sensor", ip: "192.168.1.30", os: "ESP32", status: "online", cpu: 5, ram: 20, disk: 15, uptime: "12 ngày" },
  { id: 4, name: "sensor-field-A2", type: "IoT Sensor", ip: "192.168.1.31", os: "ESP32", status: "warning", cpu: 89, ram: 92, disk: 15, uptime: "12 ngày" },
  { id: 5, name: "n8n-automation", type: "Service", ip: "192.168.1.40", os: "Docker", status: "online", cpu: 15, ram: 34, disk: 25, uptime: "45 ngày" },
  { id: 6, name: "backup-server", type: "Server", ip: "192.168.1.50", os: "Debian 12", status: "offline", cpu: 0, ram: 0, disk: 45, uptime: "-" },
];

const typeIcon: Record<string, any> = {
  "Server": Server,
  "Database": Database,
  "IoT Sensor": Wifi,
  "Service": Cpu,
};

const typeColor: Record<string, string> = {
  "Server": "gradient-primary",
  "Database": "gradient-cyber",
  "IoT Sensor": "gradient-success",
  "Service": "gradient-warning",
};

export default function AssetsPage() {
  const online = assets.filter((a) => a.status === "online").length;
  const warning = assets.filter((a) => a.status === "warning").length;
  const offline = assets.filter((a) => a.status === "offline").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng tài sản", value: assets.length, icon: Server, color: "gradient-primary" },
          { label: "Online", value: online, icon: CheckCircle, color: "gradient-success" },
          { label: "Cảnh báo", value: warning, icon: AlertTriangle, color: "gradient-warning" },
          { label: "Offline", value: offline, icon: Activity, color: "gradient-danger" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((a, i) => {
          const Icon = typeIcon[a.type] || Server;
          const color = typeColor[a.type] || "gradient-primary";
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="hover-lift rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                  a.status === "online" ? "bg-success/10 text-success border-success/30" :
                  a.status === "warning" ? "bg-warning/10 text-warning border-warning/30" :
                  "bg-danger/10 text-danger border-danger/30"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    a.status === "online" ? "bg-success animate-pulse" :
                    a.status === "warning" ? "bg-warning animate-pulse" : "bg-danger"
                  }`} />
                  {a.status}
                </span>
              </div>

              <h3 className="font-semibold">{a.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{a.type} • {a.os}</p>
              <p className="text-xs font-mono text-primary mt-1">{a.ip}</p>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {[
                  { label: "CPU", value: a.cpu, color: a.cpu > 80 ? "bg-danger" : a.cpu > 50 ? "bg-warning" : "bg-primary" },
                  { label: "RAM", value: a.ram, color: a.ram > 80 ? "bg-danger" : a.ram > 50 ? "bg-warning" : "bg-cyber" },
                  { label: "Disk", value: a.disk, color: a.disk > 80 ? "bg-danger" : a.disk > 50 ? "bg-warning" : "bg-success" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-accent overflow-hidden">
                      <div className={`h-full ${m.color} transition-all`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{a.uptime}</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" />Secure</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
