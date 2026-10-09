"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, ShieldAlert, Activity, Lock, Zap, Eye, ArrowRight, CheckCircle,
  Satellite, Brain, Bell, BarChart3, Globe, Radar, Fingerprint, Server,
  TrendingUp, Users, Clock, ChevronRight, Database, Cloud,
  MessageCircle, X, Send as SendIcon, Bot
} from "lucide-react";

const features = [
  { icon: ShieldAlert, title: "Phát hiện xâm nhập", desc: "AI phân tích log, phát hiện bất thường theo thời gian thực với độ chính xác cao", color: "gradient-primary" },
  { icon: Satellite, title: "Viễn thám Sentinel-2", desc: "Giám sát sức khỏe cây lúa qua chỉ số NDVI/NDRE từ ảnh vệ tinh", color: "gradient-cyber" },
  { icon: Brain, title: "Học máy nâng cao", desc: "15 mô hình ML/DL phân loại chuỗi thời gian, tối ưu cho dữ liệu nông nghiệp", color: "gradient-primary" },
  { icon: Bell, title: "Cảnh báo đa kênh", desc: "Telegram, Email, Dashboard thông báo tức thời khi có sự cố", color: "gradient-warning" },
  { icon: BarChart3, title: "Dashboard trực quan", desc: "Biểu đồ, bản đồ nhiệt, thống kê realtime với giao diện chuyên nghiệp", color: "gradient-cyber" },
  { icon: Lock, title: "Bảo mật đa lớp", desc: "JWT, bcrypt, phân quyền RBAC, audit log đầy đủ", color: "gradient-success" },
  { icon: Radar, title: "Giám sát 24/7", desc: "Hệ thống hoạt động liên tục, phát hiện mối đe dọa mọi lúc", color: "gradient-primary" },
  { icon: Fingerprint, title: "Điều tra sự cố", desc: "Timeline chi tiết, phân tích nguyên nhân gốc, đề xuất khắc phục", color: "gradient-danger" },
  { icon: Server, title: "Hạ tầng mạnh mẽ", desc: "Docker, PostgreSQL, n8n automation, xử lý hàng nghìn sự kiện/phút", color: "gradient-cyber" },
];

const stats = [
  { value: "1M+", label: "Sự kiện xử lý/ngày", icon: Activity },
  { value: "99.9%", label: "Uptime hệ thống", icon: TrendingUp },
  { value: "<5s", label: "Thời gian phản hồi", icon: Zap },
  { value: "24/7", label: "Giám sát liên tục", icon: Clock },
];

const capabilities = [
  { icon: Shield, title: "Chống tấn công mạng", items: ["Brute force detection", "DDoS mitigation", "SQL Injection blocker", "XSS filter"] },
  { icon: Satellite, title: "Giám sát nông nghiệp", items: ["NDVI/NDRE analysis", "Yellow leaf detection", "Drought prediction", "Pest monitoring"] },
  { icon: Brain, title: "Trí tuệ nhân tạo", items: ["Anomaly detection", "Time-series ML", "Explainable AI (XAI)", "Lead-time prediction"] },
];

const workflow = [
  { step: "01", title: "Thu thập dữ liệu", desc: "Log hệ thống, ảnh vệ tinh Sentinel-2, cảm biến IoT", icon: Cloud },
  { step: "02", title: "Phân tích AI", desc: "15 mô hình ML/DL phân tích chuỗi thời gian realtime", icon: Brain },
  { step: "03", title: "Phát hiện bất thường", desc: "So sánh baseline, phát hiện anomaly với XAI", icon: Eye },
  { step: "04", title: "Tự động ứng phó", desc: "n8n workflow block IP, gửi cảnh báo, tạo ticket", icon: Zap },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-cyber/20 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-0 left-1/2 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">RiceGuard</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Security Platform</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition">Tính năng</a>
          <a href="#capabilities" className="text-muted-foreground hover:text-foreground transition">Khả năng</a>
          <a href="#workflow" className="text-muted-foreground hover:text-foreground transition">Quy trình</a>
          <a href="#tech" className="text-muted-foreground hover:text-foreground transition">Công nghệ</a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition">
            Đăng nhập
          </Link>
          <Link href="/login" className="group flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow hover:opacity-90 transition">
            Bắt đầu
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-12 pt-16 pb-24 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Hệ thống đang hoạt động • Phiên bản 2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Bảo vệ <span className="text-gradient">nông nghiệp</span>
            <br />
            bằng <span className="text-gradient">an ninh mạng</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Nền tảng toàn diện giám sát, phát hiện và tự động ứng phó sự cố an ninh mạng
            cho hệ thống cảnh báo sớm dịch bệnh cây lúa. Kết hợp viễn thám Sentinel-2,
            học máy nâng cao và tự động hóa quy trình.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="group flex items-center gap-2 rounded-xl gradient-primary px-8 py-4 text-base font-semibold text-white glow hover:opacity-90 transition">
              Truy cập hệ thống
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </Link>
            <a href="#features" className="flex items-center gap-2 rounded-xl glass px-8 py-4 text-base font-semibold hover:bg-accent/50 transition">
              Khám phá tính năng
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            {["NextJS 15", "NodeJS", "PostgreSQL", "n8n Automation", "AI/ML", "Docker"].map((tech) => (
              <div key={tech} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                {tech}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 lg:px-12 py-16 border-y border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center group">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:scale-110 transition">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-4xl md:text-5xl font-bold text-gradient">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
              Tính năng
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Được thiết kế cho <span className="text-gradient">bảo mật nông nghiệp</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              9 tính năng cốt lõi giúp bảo vệ hệ thống và giám sát sức khỏe cây trồng một cách toàn diện
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="hover-lift group rounded-2xl glass p-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4 group-hover:scale-110 transition`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="relative z-10 px-6 lg:px-12 py-24 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-cyber/30 bg-cyber/10 px-4 py-1.5 text-xs font-medium text-cyber mb-4">
              Khả năng
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              3 trụ cột <span className="text-gradient">công nghệ</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {capabilities.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{c.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {c.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
              Quy trình
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Hoạt động <span className="text-gradient">4 bước</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {workflow.map((w, i) => {
              const Icon = w.icon;
              return (
                <motion.div key={w.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="relative">
                  <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-3xl font-bold text-gradient">{w.step}</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{w.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
                  </div>
                  {i < workflow.length - 1 && (
                    <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/50" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section id="tech" className="relative z-10 px-6 lg:px-12 py-24 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Công nghệ <span className="text-gradient">hiện đại</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "NextJS", icon: Globe },
              { name: "NodeJS", icon: Server },
              { name: "PostgreSQL", icon: Database },
              { name: "n8n", icon: Zap },
              { name: "Docker", icon: Cloud },
              { name: "AI/ML", icon: Brain },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div key={t.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }} className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center gap-3 hover:border-primary/50 transition group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:scale-110 transition">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{t.name}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-cyber/5 to-transparent p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyber/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mb-6 glow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Sẵn sàng <span className="text-gradient">bảo vệ</span> hệ thống của bạn?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Bắt đầu giám sát an ninh mạng cho hệ thống nông nghiệp thông minh ngay hôm nay
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/login" className="group flex items-center gap-2 rounded-xl gradient-primary px-8 py-4 text-base font-semibold text-white glow hover:opacity-90 transition">
                  Đăng nhập ngay
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">RiceGuard</p>
                  <p className="text-[10px] text-muted-foreground">Security Platform</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Nền tảng giám sát và bảo vệ an ninh mạng cho hệ thống nông nghiệp thông minh,
                kết hợp viễn thám, AI và tự động hóa.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">All systems operational</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Sản phẩm</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition">Tính năng</a></li>
                <li><a href="#capabilities" className="hover:text-foreground transition">Khả năng</a></li>
                <li><a href="#workflow" className="hover:text-foreground transition">Quy trình</a></li>
                <li><a href="#tech" className="hover:text-foreground transition">Công nghệ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Hỗ trợ</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Tài liệu</a></li>
                <li><a href="#" className="hover:text-foreground transition">Hướng dẫn</a></li>
                <li><a href="#" className="hover:text-foreground transition">Liên hệ</a></li>
                <li><a href="#" className="hover:text-foreground transition">Báo lỗi</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 RiceGuard. Bảo lưu mọi quyền.
            </p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition">Chính sách bảo mật</a>
              <a href="#" className="hover:text-foreground transition">Điều khoản</a>
              <a href="#" className="hover:text-foreground transition">Cookie</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "bot", text: "Xin chào! Tôi là trợ lý AI của RiceGuard. Tôi có thể giúp bạn tìm hiểu về nền tảng, tính năng hoặc giải đáp thắc mắc." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");

    setTimeout(() => {
      let reply = "Cảm ơn bạn đã hỏi! Đây là hệ thống giám sát an ninh mạng cho nông nghiệp.";
      const q = userMsg.toLowerCase();
      if (q.includes("tính năng") || q.includes("feature")) reply = "RiceGuard có 9 tính năng chính: phát hiện xâm nhập, viễn thám Sentinel-2, học máy, cảnh báo đa kênh, dashboard, bảo mật, giám sát 24/7, điều tra sự cố, hạ tầng mạnh mẽ.";
      else if (q.includes("đăng nhập") || q.includes("login")) reply = "Đăng nhập bằng admin/admin123. Nhấn nút 'Đăng nhập' ở góc phải trên màn hình.";
      else if (q.includes("lúa") || q.includes("vàng lá")) reply = "Hệ thống phân tích chỉ số NDVI/NDRE từ ảnh vệ tinh Sentinel-2 để phát hiện sớm vàng lá lúa.";
      else if (q.includes("giá") || q.includes("phí")) reply = "RiceGuard là nền tảng mã nguồn mở, hoàn toàn miễn phí.";
      else if (q.includes("liên hệ")) reply = "Vui lòng liên hệ qua email support@riceguard.vn.";
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    }, 800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-primary glow hover:scale-110 transition shadow-2xl"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 gradient-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">RiceGuard AI</p>
              <p className="text-[10px] text-white/70 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Đang trực tuyến
              </p>
            </div>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "gradient-primary text-white" : "bg-accent text-foreground"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Hỏi gì đó..."
              className="flex-1 h-10 rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary/50"
            />
            <button onClick={handleSend} className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
