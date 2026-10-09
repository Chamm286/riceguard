"use client";
import { motion } from "framer-motion";
import { Cloud, Droplets, Wind, Thermometer, Eye, AlertTriangle, TrendingUp } from "lucide-react";

const forecast = [
  { day: "Hôm nay", temp: 32, icon: Cloud, rain: 60, humidity: 78, risk: "Cao" },
  { day: "Mai", temp: 31, icon: Cloud, rain: 45, humidity: 75, risk: "Trung bình" },
  { day: "Ngày kia", temp: 30, icon: Droplets, rain: 80, humidity: 85, risk: "Rất cao" },
  { day: "Thứ 4", temp: 33, icon: Thermometer, rain: 20, humidity: 65, risk: "Thấp" },
  { day: "Thứ 5", temp: 34, icon: Thermometer, rain: 10, humidity: 60, risk: "Thấp" },
];

const diseaseRisks = [
  { name: "Đạo ôn (Blast)", risk: 85, level: "cao", color: "danger" },
  { name: "Đốm nâu", risk: 62, level: "trung bình", color: "warning" },
  { name: "Khô vằn", risk: 30, level: "thấp", color: "success" },
  { name: "Bạc lá", risk: 45, level: "trung bình", color: "warning" },
];

export default function WeatherPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thời tiết &amp; Dự báo bệnh</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Điều kiện khí hậu ảnh hưởng đến nguy cơ bùng phát bệnh
        </p>
      </div>

      {/* Current weather */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-8"
      >
        <div className="absolute top-0 right-0 h-64 w-64 gradient-primary rounded-full blur-3xl opacity-20" />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-sm text-primary font-semibold uppercase tracking-widest">Hiện tại</p>
            <h2 className="text-6xl font-bold mt-2">32°C</h2>
            <p className="text-sm text-muted-foreground mt-1">Nhiều mây, có mưa rào</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <WeatherMetric icon={Droplets} label="Độ ẩm" value="78%" />
            <WeatherMetric icon={Wind} label="Gió" value="12 km/h" />
            <WeatherMetric icon={Eye} label="Tầm nhìn" value="10 km" />
          </div>
        </div>
      </motion.div>

      {/* 5-day forecast */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Dự báo 5 ngày</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {forecast.map((f, i) => (
            <motion.div
              key={f.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/50 transition"
            >
              <p className="text-xs font-semibold text-muted-foreground">{f.day}</p>
              <f.icon className="h-8 w-8 mx-auto my-3 text-primary" />
              <p className="text-2xl font-bold">{f.temp}°</p>
              <p className="text-[10px] text-muted-foreground mt-2">💧 {f.rain}% · {f.humidity}%</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disease risk */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" /> Nguy cơ bùng phát bệnh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diseaseRisks.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">{d.name}</p>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  d.color === "danger" ? "bg-danger/20 text-danger" :
                  d.color === "warning" ? "bg-warning/20 text-warning" :
                  "bg-success/20 text-success"
                }`}>{d.level}</span>
              </div>
              <div className="h-2 rounded-full bg-accent overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.risk}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 1 }}
                  className={`h-full ${
                    d.color === "danger" ? "gradient-danger" :
                    d.color === "warning" ? "gradient-warning" : "gradient-success"
                  }`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Nguy cơ: {d.risk}%</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeatherMetric({ icon: Icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
