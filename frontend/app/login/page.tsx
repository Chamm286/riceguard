"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api, { getApiErrorMessage } from "@/lib/api";
import { Shield, Lock, Loader2, ArrowLeft, Eye, EyeOff, Terminal, Zap, Globe, Activity, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(11, 17, 32, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#10b981";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.95 ? "#38bdf8" : "#10b981";
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1;

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => { clearInterval(interval); window.removeEventListener("resize", resize); };
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
    <div className="relative flex min-h-screen overflow-hidden bg-[#0b1120]">
      {/* Matrix rain canvas - left side only */}
      <div className="absolute inset-0 lg:w-1/2 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0b1120]/60 to-[#0b1120]" />
      </div>

      {/* Left panel - branding */}
      <div className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">RiceGuard</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60">Security Operations Center</p>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              System Online • v2.0
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-[1.1]">
              Bảo vệ <span className="text-primary">mùa màng</span>
              <br />
              Bảo vệ <span className="text-cyber">hệ thống</span>
            </h1>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Nền tảng SOC chuyên dụng cho nông nghiệp thông minh: phát hiện xâm nhập thời gian thực,
              giám sát viễn thám Sentinel-2, cảnh báo tự động và ứng phó sự cố tức thời.
            </p>
          </div>

          <div className="space-y-2">
            {[
              "Phát hiện xâm nhập bằng AI (15 mô hình ML/DL)",
              "Giám sát viễn thám Sentinel-2 (NDVI/NDRE)",
              "Cảnh báo tự động qua Telegram/Email",
              "Bảo mật đa lớp: JWT, bcrypt, RBAC, WAF",
              "Dashboard thời gian thực với Socket.io",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2.5 text-[12px] text-muted-foreground"
              >
                <ChevronRight className="h-3 w-3 text-primary" />
                {item}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-primary" />
              n8n: 5 workflows
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-success" />
              API: 129 endpoints
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-cyber" />
              DB: connected
            </span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/50">© 2026 RiceGuard • Bảo lưu mọi quyền</p>
      </div>

      {/* Right panel - login form */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="absolute inset-0 bg-[#0b1120]/80 backdrop-blur-sm lg:bg-transparent" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-[400px]"
        >
          {/* Glass card */}
          <div className="rounded-2xl border border-primary/20 bg-card/60 p-8 shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
              >
                <Shield className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight">RiceGuard SOC</h1>
              <p className="mt-1 text-[12px] text-muted-foreground">Đăng nhập hệ thống điều hành an ninh mạng</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Terminal className="h-3 w-3" />
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    className="h-11 w-full rounded-lg border border-border bg-input/80 px-4 text-sm outline-none placeholder:text-muted-foreground/40 transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-border bg-input/80 px-4 pr-11 text-sm outline-none placeholder:text-muted-foreground/40 transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-[12px] text-danger"
                  >
                    <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary to-cyber text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] transition-all hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmer 2.5s infinite" }} />
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Truy cập hệ thống
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
                JWT • bcrypt • RBAC • WAF
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground/40">
            RiceGuard SOC v2.0 • Bảo vệ mùa màng & Bảo vệ hệ thống
          </p>
        </motion.div>
      </div>
    </div>
  );
}
