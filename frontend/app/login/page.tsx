"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api, { getApiErrorMessage } from "@/lib/api";
import { Shield, Lock, Loader2, ArrowLeft, Eye, EyeOff, Activity, Globe, Server, Radar, Terminal, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("vi-VN"));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        router.push("/dashboard");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#050a0e]">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "gridMove 20s linear infinite",
        }}
      />
      <style>{`
        @keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }
        @keyframes scanLine { 0% { top: -2px; } 100% { top: 100%; } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      `}</style>

      {/* Scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" style={{ animation: "scanLine 4s linear infinite" }} />
      </div>

      {/* Glowing orbs */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyber/10 blur-[120px]" />

      {/* Left panel */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden border-r border-primary/10 p-12 lg:flex">
        {/* Radar */}
        <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 opacity-20">
          <div className="relative h-[400px] w-[400px]">
            <div className="absolute inset-0 rounded-full border border-primary/30" />
            <div className="absolute inset-[40px] rounded-full border border-primary/20" />
            <div className="absolute inset-[80px] rounded-full border border-primary/15" />
            <div className="absolute inset-[120px] rounded-full border border-primary/10" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
            <div className="absolute left-1/2 top-1/2 h-[200px] w-[1px] origin-bottom bg-gradient-to-t from-primary/60 to-transparent" style={{ animation: "spin 4s linear infinite", transformOrigin: "50% 100%" }} />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
            <div className="absolute inset-0 rounded-lg" style={{ animation: "pulseRing 2s ease-out infinite" }} />
          </div>
          <div>
            <p className="text-[16px] font-bold tracking-tight">RiceGuard</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70">Security Operations Center</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              System Online
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-[1.1]">
              Điều hành an ninh mạng
              <br />
              <span className="text-primary">cho nông nghiệp thông minh</span>
            </h1>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Nền tảng SOC chuyên dụng: phát hiện xâm nhập thời gian thực, giám sát viễn thám Sentinel-2,
              cảnh báo tự động đa kênh và ứng phó sự cố tức thời.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Activity, label: "Giám sát 24/7", value: "Real-time", color: "text-primary" },
              { icon: Globe, label: "GeoIP Tracking", value: "Global", color: "text-cyber" },
              { icon: Radar, label: "Phát hiện AI", value: "15 models", color: "text-warning" },
              { icon: Server, label: "Hạ tầng", value: "99.9% uptime", color: "text-success" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="group rounded-lg border border-border/60 bg-card/40 p-3 backdrop-blur transition hover:border-primary/40">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="text-[13px] font-semibold">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />
              n8n: 5 workflows active
            </span>
            <span className="flex items-center gap-1.5">
              <Server className="h-3 w-3" />
              BE: online
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              DB: connected
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {time}
          </span>
          <span>v2.0.0 • RiceGuard SOC</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        {/* Corner decorations */}
        <div className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-primary/30" />
        <div className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-primary/30" />
        <div className="pointer-events-none absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-primary/30" />
        <div className="pointer-events-none absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-primary/30" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[360px]"
        >
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-xl border border-primary/40 bg-primary/5" />
              <div className="absolute inset-0 rounded-xl" style={{ animation: "pulseRing 2.5s ease-out infinite" }} />
              <Shield className="relative h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Xác thực truy cập</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Nhập thông tin đăng nhập để vào hệ thống SOC</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Terminal className="h-3 w-3" />
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="mt-1.5 h-10 w-full rounded-md border border-border bg-input/80 px-3 text-sm outline-none placeholder:text-muted-foreground/40 transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3 w-3" />
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-md border border-border bg-input/80 px-3 pr-10 text-sm outline-none placeholder:text-muted-foreground/40 transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "shimmer 2s infinite" }} />
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Truy cập hệ thống
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground">
            <Link href="/" className="flex items-center gap-1.5 transition hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Trang chủ
            </Link>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              JWT • bcrypt • RBAC
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
