"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, X, AlertTriangle, Leaf, Bug } from "lucide-react";

const diseases = [
  { id: 1, name: "Đạo ôn (Blast)", icon: "🍄", severity: "cao", symptoms: "Vết bệnh hình thoi, tâm xám tro, viền nâu đỏ. Xuất hiện ở lá, đòng, cổ bông.", cause: "Nấm Pyricularia oryzae. Phát triển mạnh khi ẩm độ cao, nhiệt độ 24-28°C.", treatment: "Phun thuốc Tricyclazole, Isoprothiolane. Bón cân đối NPK, tránh bón thừa đạm.", prevention: "Dùng giống kháng, xử lý hạt giống, vệ sinh đồng ruộng." },
  { id: 2, name: "Đốm nâu", icon: "🟤", severity: "trung bình", symptoms: "Vết bệnh hình tròn, màu nâu, viền vàng. Lan nhanh khi mưa nhiều.", cause: "Nấm Bipolaris oryzae. Lây lan qua nước, gió.", treatment: "Phun thuốc Hexaconazole, Propiconazole. Bón kali tăng sức đề kháng.", prevention: "Thoát nước tốt, bón phân cân đối." },
  { id: 3, name: "Khô vằn", icon: "🟡", severity: "cao", symptoms: "Vết bệnh hình vằn da hổ, lan từ bẹ lá lên. Cây khô, lép hạt.", cause: "Nấm Rhizoctonia solani. Sống trong đất, phát triển khi ẩm thấp.", treatment: "Phun Validamycin, Hexaconazole. Rút nước phơi đồng.", prevention: "Cày sâu, vệ sinh đồng ruộng, mật độ gieo hợp lý." },
  { id: 4, name: "Bạc lá", icon: "🍂", severity: "cao", symptoms: "Lá chuyển vàng nhạt từ chóp vào, mép lá gợn sóng, khô trắng.", cause: "Vi khuẩn Xanthomonas oryzae. Lan nhanh qua nước tưới.", treatment: "Phun Kasugamycin, Streptomycin. Ngừng bón đạm tạm thời.", prevention: "Không bón thừa đạm, giống kháng, thoát nước." },
  { id: 5, name: "Vàng lá do virus", icon: "🟢", severity: "trung bình", symptoms: "Lá vàng từ gốc lên, cây thấp lùn, trổ bông kém.", cause: "Virus lây qua rầy nâu. Rầy chích hút truyền virus.", treatment: "Diệt rầy nâu bằng Applaud, Chess. Không có thuốc trị virus trực tiếp.", prevention: "Kiểm soát rầy nâu, trồng giống kháng, né rầy." },
  { id: 6, name: "Lem lép hạt", icon: "🌾", severity: "trung bình", symptoms: "Hạt lép, đen, không vào gạo. Trổ bông không thoát.", cause: "Vi khuẩn Burkholderia glumae. Phát triển khi trổ gặp mưa.", treatment: "Phun khi trổ đòng: Kasugamycin + Copper.", prevention: "Xử lý giống, tránh trổ vào mùa mưa." },
];

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const filtered = diseases.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.symptoms.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thư viện bệnh lúa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tra cứu triệu chứng, nguyên nhân và cách xử lý các bệnh lúa phổ biến
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm bệnh theo tên hoặc triệu chứng..."
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(d)}
            className="text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition group"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition">{d.name}</h3>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  d.severity === "cao" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                }`}>{d.severity}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{d.symptoms}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{selected.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <span className={`inline-block mt-1 text-xs font-bold uppercase px-3 py-1 rounded-full ${
                    selected.severity === "cao" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                  }`}>Mức độ: {selected.severity}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Section icon={Leaf} title="Triệu chứng" content={selected.symptoms} color="text-success" />
                <Section icon={Bug} title="Nguyên nhân" content={selected.cause} color="text-warning" />
                <Section icon={AlertTriangle} title="Cách xử lý" content={selected.treatment} color="text-danger" />
                <Section icon={BookOpen} title="Phòng ngừa" content={selected.prevention} color="text-primary" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ icon: Icon, title, content, color }: any) {
  return (
    <div className="rounded-xl border border-border bg-accent/30 p-4">
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        <Icon className="h-4 w-4" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}
