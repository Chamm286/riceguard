"use client";
import { motion } from "framer-motion";
import { Server, Database, Cpu, HardDrive, Activity, Wifi, CheckCircle2 } from "lucide-react";

const services = [
  { name: "Backend API", status: "online", uptime: "99.9%", port: 5000 },
  { name: "Frontend Next.js", status: "online", uptime: "99.8%", port: 3000 },
  { name: "PostgreSQL", status: "online", uptime: "100%", port: 5432 },
  { name: "n8n Workflow", status: "online", uptime: "99.7%", port: 5678 },
  { name: "Telegram Bot", status: "online", uptime: "100%", port: "-" },
];

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trạng thái hệ thống</h1>
        <p className="text-sm text-muted-foreground mt-1">Giám sát các service và tài nguyên máy chủ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={Cpu} label="CPU" value="24%" sub="8 cores" color="primary" />
        <MetricCard icon={HardDrive} label="RAM" value="3.2/16 GB" sub="20% used" color="success" />
        <MetricCard icon={Database} label="Disk" value="142/500 GB" sub="28% used" color="cyber" />
        <MetricCard icon={Wifi} label="Network" value="1.2 MB/s" sub="Incoming" color="warning" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Services</h3>
        </div>
        <div className="divide-y divide-border">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-accent/30 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/20">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Port: {s.port}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  {s.status}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Uptime: {s.uptime}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: any) {
  const gradients: any = { primary: "gradient-primary", success: "gradient-success", cyber: "gradient-cyber", warning: "gradient-warning" };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradients[color]} mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </motion.div>
  );
}
