"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import api, { getApiErrorMessage } from "@/lib/api";
import { Shield, Lock, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight">RiceGuard</p>
            <p className="text-[10px] leading-tight text-muted-foreground">Security Platform</p>
          </div>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Trang chủ
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[360px]"
        >
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight">Đăng nhập RiceGuard</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Nền tảng an ninh mạng nông nghiệp</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="text-xs font-medium text-foreground">
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-sm outline-none placeholder:text-muted-foreground/60 transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="text-xs font-medium text-foreground">
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
                    className="h-9 w-full rounded-md border border-border bg-input px-3 pr-10 text-sm outline-none placeholder:text-muted-foreground/60 transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:text-foreground"
                    tabIndex={-1}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Phiên đăng nhập được bảo vệ bằng JWT
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            © 2026 RiceGuard
          </p>
        </motion.div>
      </main>
    </div>
  );
}
