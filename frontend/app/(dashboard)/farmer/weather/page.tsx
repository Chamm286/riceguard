'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Cloud, CloudRain, Droplets, RefreshCw, Wind } from 'lucide-react';
import { useApiData } from '@/hooks/use-api-data';
import { DataState } from '@/components/common/data-state';
import { PageHeader } from '@/components/common/page-header';

interface WeatherData {
  source: string;
  location: { latitude: number; longitude: number; timezone: string };
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    weather: string;
    time: string;
  };
  daily: Array<{
    date: string;
    weather: string;
    tempMax: number;
    tempMin: number;
    rain: number;
    rainProbability: number;
    humidity: number;
  }>;
  diseaseRisks: Array<{ name: string; risk: number; level: string; color: string }>;
  fetchedAt: string;
}

function dayLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export default function WeatherPage() {
  const weatherQuery = useApiData<WeatherData>('/weather', { pollMs: 600000 });
  const weather = weatherQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thời tiết & Dự báo bệnh"
        description="Điều kiện khí hậu ảnh hưởng đến nguy cơ bùng phát bệnh"
        action={
          <button onClick={weatherQuery.refetch} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/50">
            <RefreshCw className={`h-4 w-4 ${weatherQuery.refreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        }
      />

      <DataState loading={weatherQuery.loading} error={weatherQuery.error} onRetry={weatherQuery.refetch}>
        {weather && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-8"
            >
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full gradient-primary opacity-20 blur-3xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary">Hiện tại · {weather.source}</p>
                  <h2 className="mt-2 text-6xl font-bold">{weather.current.temperature}°C</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{weather.current.weather}</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <WeatherMetric icon={Droplets} label="Độ ẩm" value={`${weather.current.humidity}%`} />
                  <WeatherMetric icon={Wind} label="Gió" value={`${weather.current.windSpeed} km/h`} />
                  <WeatherMetric icon={CloudRain} label="Mưa" value={`${weather.current.precipitation} mm`} />
                </div>
              </div>
            </motion.div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Dự báo 5 ngày</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {weather.daily.map((day, index) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-border bg-card p-4 text-center transition hover:border-primary/50"
                  >
                    <p className="text-xs font-semibold text-muted-foreground">{dayLabel(day.date)}</p>
                    <Cloud className="mx-auto my-3 h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{Math.round(day.tempMax)}°</p>
                    <p className="text-[10px] text-muted-foreground">↓ {Math.round(day.tempMin)}°</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">💧 {day.rainProbability}% · {day.humidity}%</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="h-5 w-5 text-warning" /> Nguy cơ bùng phát bệnh
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {weather.diseaseRisks.map((disease, index) => (
                  <motion.div
                    key={disease.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">{disease.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                        disease.color === 'danger' ? 'bg-danger/20 text-danger' :
                        disease.color === 'warning' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      }`}>{disease.level}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-accent">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${disease.risk}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 1 }}
                        className={`h-full ${
                          disease.color === 'danger' ? 'gradient-danger' :
                          disease.color === 'warning' ? 'gradient-warning' : 'gradient-success'
                        }`}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Nguy cơ: {disease.risk}%</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-right text-[10px] text-muted-foreground">
              Cập nhật: {new Date(weather.fetchedAt).toLocaleString('vi-VN')}
            </p>
          </>
        )}
      </DataState>
    </div>
  );
}

function WeatherMetric({ icon: Icon, label, value }: { icon: typeof Droplets; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
