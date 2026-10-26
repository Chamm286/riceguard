"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import api, { getApiErrorMessage } from "@/lib/api";
import { Shield, Lock, Loader2, ArrowLeft, Eye, EyeOff, Activity, Globe, Server } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="relative flex min-h-screen bg-background">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyber/5" />

      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-border p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight">RiceGuard</p>
            <p className="text-[11px] text-muted-foreground">Security Operations Center</p>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Giám sát an ninh mạng
              <br />
              <span className="text-primary">cho nông nghiệp thông minh</span>
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Nền tảng SOC chuyên dụng: phát hiện xâm nhập, giám sát viễn thám Sentinel-2,
              cảnh báo tự động và ứng phó sự cố thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Activity, label: "Giám sát 24/7", value: "Real-time" },
              { icon: Globe, label: "GeoIP Tracking", value: "Global" },
              { icon: Server, label: "Hạ tầng", value: "99.9% uptime" },
              { icon: Shield, label: "Bảo mật", value: "Multi-layer" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border bg-card/50 p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-[13px] font-medium">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Hệ thống đang hoạt động
          </span>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-lg font-semibold">RiceGuard SOC</h1>
            <p className="text-[12px] text-muted-foreground">Security Operations Center</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Đăng nhập</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Truy cập hệ thống điều hành an ninh mạng</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-[11px] font-medium text-muted-foreground">
                Tên đăng nhập
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="mt-1.5 h-10 w-full rounded-md border border-border bg-input px-3 text-sm outline-none placeholder:text-muted-foreground/50 transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-[11px] font-medium text-muted-foreground">
                Mật khẩu
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-md border border-border bg-input px-3 pr-10 text-sm outline-none placeholder:text-muted-foreground/50 transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
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

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[12px] text-danger"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
            <Link href="/" className="flex items-center gap-1.5 transition hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Trang chủ
            </Link>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              JWT + bcrypt
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
