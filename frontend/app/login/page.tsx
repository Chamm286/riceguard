"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import api, { getApiErrorMessage } from "@/lib/api";
import {
  Shield, Lock, User as UserIcon, Loader2, ArrowRight, ArrowLeft,
  Eye, EyeOff, CheckCircle, Sparkles
} from "lucide-react";

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
    <div className="relative min-h-screen flex overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="absolute bottom-0 right-1/4 h-[600px] w-[600px] rounded-full bg-cyber/20 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-cyan-500/5 blur-3xl" />

      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">RiceGuard</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Security Platform</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Bảo vệ hệ thống nông nghiệp thông minh
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Bảo vệ <span className="text-gradient">nông nghiệp</span>
            <br />
            bằng <span className="text-gradient">an ninh mạng</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
            Nền tảng giám sát, phát hiện và tự động ứng phó sự cố an ninh mạng cho hệ thống cảnh báo sớm dịch bệnh cây lúa.
          </p>

          <div className="space-y-3">
            {[
              "Phát hiện xâm nhập bằng AI",
              "Giám sát viễn thám Sentinel-2",
              "Cảnh báo tự động qua Telegram",
              "Bảo mật đa lớp với JWT",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          Hệ thống đang hoạt động • Phiên bản 2.0
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-2xl glow">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">RiceGuard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Nền tảng An ninh mạng Nông nghiệp</p>
          </div>

          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Về trang chủ
          </Link>

          <div className="glass-strong rounded-3xl border border-border p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Đăng nhập</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Nhập thông tin để truy cập hệ thống
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="h-3 w-3" />
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full h-12 rounded-xl border border-border bg-input pl-11 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Mật khẩu
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 rounded-xl border border-border bg-input pl-11 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                    tabIndex={-1}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl bg-danger/10 border border-danger/30 p-3 text-xs text-danger"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-12 rounded-xl gradient-primary text-white font-semibold shadow-lg glow hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Phiên đăng nhập được bảo vệ bằng JWT
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-muted-foreground">
            © 2026 RiceGuard • Bảo lưu mọi quyền
          </p>
        </motion.div>
      </div>
    </div>
  );
}
