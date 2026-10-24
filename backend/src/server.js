const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./config/database');
const { startLogReader } = require('./services/logReader');
const { startAlertPoller } = require('./services/alertPoller');

const PORT = process.env.PORT || 5000;

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY, ip VARCHAR(45) UNIQUE NOT NULL,
    reason TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS ip VARCHAR(45)`);
  await pool.query(`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
  await pool.query(`CREATE TABLE IF NOT EXISTS workflow_logs (
    id SERIAL PRIMARY KEY, workflow_id VARCHAR(100), status VARCHAR(20),
    execution_count INT, message TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow_id ON workflow_logs (workflow_id)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS disease_library (
    id SERIAL PRIMARY KEY, name VARCHAR(150) UNIQUE NOT NULL, icon VARCHAR(20),
    severity VARCHAR(30), symptoms TEXT, cause TEXT, treatment TEXT, prevention TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  const diseases = [
    ['Đạo ôn (Blast)', '🍄', 'cao', 'Vết bệnh hình thoi, tâm xám tro, viền nâu đỏ. Xuất hiện ở lá, đòng, cổ bông.', 'Nấm Pyricularia oryzae. Phát triển mạnh khi ẩm độ cao, nhiệt độ 24-28°C.', 'Phun thuốc Tricyclazole, Isoprothiolane. Bón cân đối NPK, tránh bón thừa đạm.', 'Dùng giống kháng, xử lý hạt giống, vệ sinh đồng ruộng.'],
    ['Đốm nâu', '🟤', 'trung bình', 'Vết bệnh hình tròn, màu nâu, viền vàng. Lan nhanh khi mưa nhiều.', 'Nấm Bipolaris oryzae. Lây lan qua nước, gió.', 'Phun thuốc Hexaconazole, Propiconazole. Bón kali tăng sức đề kháng.', 'Thoát nước tốt, bón phân cân đối.'],
    ['Khô vằn', '🟡', 'cao', 'Vết bệnh hình vằn da hổ, lan từ bẹ lá lên. Cây khô, lép hạt.', 'Nấm Rhizoctonia solani. Sống trong đất, phát triển khi ẩm thấp.', 'Phun Validamycin, Hexaconazole. Rút nước phơi đồng.', 'Cày sâu, vệ sinh đồng ruộng, mật độ gieo hợp lý.'],
    ['Bạc lá', '🍂', 'cao', 'Lá chuyển vàng nhạt từ chóp vào, mép lá gợn sóng, khô trắng.', 'Vi khuẩn Xanthomonas oryzae. Lan nhanh qua nước tưới.', 'Phun Kasugamycin, Streptomycin. Ngừng bón đạm tạm thời.', 'Không bón thừa đạm, giống kháng, thoát nước.'],
    ['Vàng lá do virus', '🟢', 'trung bình', 'Lá vàng từ gốc lên, cây thấp lùn, trổ bông kém.', 'Virus lây qua rầy nâu. Rầy chích hút truyền virus.', 'Diệt rầy nâu bằng Applaud, Chess. Không có thuốc trị virus trực tiếp.', 'Kiểm soát rầy nâu, trồng giống kháng, né rầy.'],
    ['Lem lép hạt', '🌾', 'trung bình', 'Hạt lép, đen, không vào gạo. Trổ bông không thoát.', 'Vi khuẩn Burkholderia glumae. Phát triển khi trổ bông gặp mưa.', 'Phun khi trổ đòng: Kasugamycin + Copper.', 'Xử lý giống, tránh trổ vào mùa mưa.'],
  ];

  for (const disease of diseases) {
    await pool.query(
      `INSERT INTO disease_library (name, icon, severity, symptoms, cause, treatment, prevention)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name) DO NOTHING`,
      disease
    );
  }
}

ensureTables().catch(console.error);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, path: '/socket.io' });
app.set('io', io);
global.io = io;

io.on('connection', (socket) => {
  socket.join('alerts');
});

global.emitNewAlert = (alert) => {
  io.to('alerts').emit('new_alert', alert);
};

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server chạy tại http://0.0.0.0:${PORT}`);
  startAlertPoller();
  startLogReader();
});
