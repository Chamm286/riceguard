"use client";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, MapPin, Clock, CheckCircle2, TrendingUp } from "lucide-react";

const alerts = [
  { id: 1, type: "outbreak", title: "Bùng phát đạo ôn tại Vùng C1", desc: "Phát hiện 5 báo cáo mới về đạo ôn trong 24h tại khu vực của bạn", level: "critical", time: "10 phút trước", region: "Vùng C1 - Tân Hồng" },
  { id: 2, type: "weather", title: "Nguy cơ khô vằn cao", desc: "Độ ẩm tăng 85% + nhiệt độ 26°C — điều kiện lý tưởng cho nấm khô vằn", level: "high", time: "2 giờ trước", region: "Toàn khu vực" },
  { id: 3, type: "info", title: "5 nông dân cùng vùng báo bệnh", desc: "Vùng A2 ghi nhận 5 báo cáo đốm nâu trong tuần này", level: "medium", time: "1 ngày trước", region: "Vùng A2 - Tháp Mười" },
];

export default function FarmerAlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cảnh báo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thông báo về bệnh bùng phát và điều kiện thời tiết nguy hiểm
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatBox icon={AlertTriangle} label="Cảnh báo mới" value={alerts.length} color="danger" />
        <StatBox icon={TrendingUp} label="Bùng phát vùng" value="2" color="warning" />
        <StatBox icon={CheckCircle2} label="Đã xử lý" value="12" color="success" />
      </div>

      <div className="space-y-3">
        {alerts.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl border bg-card p-5 hover:border-primary/50 transition cursor-pointer ${
              a.level === "critical" ? "border-danger/50" :
              a.level === "high" ? "border-warning/50" : "border-border"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                a.level === "critical" ? "gradient-danger" :
                a.level === "high" ? "gradient-warning" : "gradient-primary"
              }`}>
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{a.title}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    a.level === "critical" ? "bg-danger/20 text-danger" :
                    a.level === "high" ? "bg-warning/20 text-warning" :
                    "bg-primary/20 text-primary"
                  }`}>{a.level}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{a.desc}</p>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.region}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: any) {
  const gradients: any = { danger: "gradient-danger", warning: "gradient-warning", success: "gradient-success" };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradients[color]} mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
}
