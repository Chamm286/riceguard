# 🌾 RiceGuard

**Hệ thống cảnh báo sớm dịch bệnh lúa & Giám sát an ninh mạng**

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![n8n](https://img.shields.io/badge/n8n-2.41-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)
[![Gemini](https://img.shields.io/badge/Gemini-3.8_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Nền tảng AI tích hợp giúp **nông dân** phát hiện sớm dịch bệnh trên lúa và hỗ trợ **đội ngũ an ninh mạng** giám sát, ngăn chặn tấn công theo thời gian thực.

---

## 📖 Giới thiệu

**RiceGuard** là hệ thống full-stack kết hợp **Trí tuệ nhân tạo (AI)** và **tự động hóa quy trình (n8n)** để giải quyết hai bài toán:

| Lĩnh vực | Mục tiêu |
|----------|----------|
| 🌾 **Nông nghiệp** | Chẩn đoán bệnh lúa qua ảnh bằng Gemini AI, phân tích vệ tinh (NDVI), cảnh báo Telegram |
| 🔒 **An ninh mạng** | Phát hiện tấn công (SQLi, XSS, SSH Brute Force, Port Scan...), auto block IP, giám sát visitor |

Hệ thống theo kiến trúc **microservices**, tách biệt **Frontend (Next.js)** — **Backend API (Node.js)** — **Workflow Engine (n8n)** — **Database (PostgreSQL)**, đảm bảo khả năng mở rộng và triển khai độc lập.

---

## ✨ Tính năng nổi bật

### 🌾 Phân hệ Nông nghiệp
- **Chẩn đoán bệnh lúa bằng AI**: Upload ảnh → Gemini Vision phân tích → trả về loại bệnh, mức độ, đề xuất thuốc.
- **Phân tích vệ tinh**: Tính chỉ số **NDVI** đánh giá sức khỏe cây trồng theo vùng.
- **Cảnh báo tự động**: Gửi thông báo qua **Telegram Bot** khi phát hiện bệnh.
- **Dashboard trực quan**: Bản đồ heatmap dịch bệnh + biểu đồ thống kê.

### 🔒 Phân hệ An ninh mạng
- **Phát hiện tấn công**: SQL Injection, XSS, Path Traversal, Command Injection, SSH Brute Force, Port Scan.
- **Auto Block IP**: Tự động thêm IP độc hại vào firewall.
- **Báo cáo hàng ngày**: Tổng hợp sự kiện qua email/Telegram.
- **SOC Dashboard**: Giám sát realtime + bản đồ tấn công GeoIP.

---

## 🏗️ Kiến trúc hệ thống
Người dùng → Next.js Frontend → Node.js API → PostgreSQL
↓
n8n Workflow Engine
↓
┌─────────────────┼─────────────────┐
▼ ▼ ▼
Telegram Firewall Gemini
Bot (iptables) AI

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | Next.js 15.1, TailwindCSS, Chart.js, Leaflet |
| **Backend** | Node.js 24, Express.js 5, Prisma ORM, JWT |
| **Database** | PostgreSQL 18 |
| **Workflow** | n8n 2.41 |
| **AI** | Google Gemini 3.8 Flash (Vision + LLM) |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 🚀 Cài đặt nhanh

### Yêu cầu
- Node.js ≥ 24 · PostgreSQL ≥ 18 · Docker ≥ 27 · Git

### Các bước

```bash
# 1. Clone
git clone https://github.com/Chamm286/riceguard.git
cd riceguard

# 2. Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev              # → http://localhost:3001

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env.local
npm run dev              # → http://localhost:3000

# 4. n8n
docker run -d --name riceguard-n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:2.41.5       # → http://localhost:5678
🐳 Chạy toàn bộ bằng Docker Compose
docker-compose up -d
Service	URL
Frontend	http://localhost:3000
Backend API	http://localhost:3001
n8n	http://localhost:5678
PostgreSQL	localhost:5432
⚙️ Cấu hình môi trường
Backend — .env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://riceguard:password@localhost:5432/riceguard"
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=AIzaSy...
N8N_WEBHOOK_URL=http://localhost:5678/webhook
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
Frontend — .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_N8N_URL=http://localhost:5678
📂 Cấu trúc thư mục
riceguard/
├── backend/              # Node.js API + Prisma
├── frontend/             # Next.js App Router
├── n8n-workflows/
│   ├── agri/             # D1, D3, D4
│   └── security/         # A1 → A8
├── docs/                 # Tài liệu kiến trúc, API
├── docker-compose.yml
├── LICENSE
└── README.md
👥 Đội ngũ phát triển
Họ và tên	Vai trò	Trách nhiệm
Nguyễn Thị Bích Trâm	🎯 Leader — Backend	Điều phối dự án, thiết kế API, nghiệp vụ cốt lõi
Tống Mỹ Trà	🎨 Frontend	UI/UX, dashboard, tích hợp API
Trần Anh Tuấn	⚙️ Backend	Service, tích hợp AI, xử lý dữ liệu
Nguyễn Hữu Thuận	🚀 DevOps / n8n	Workflow, CI/CD, hạ tầng
🤝 Đóng góp

    Fork repo

    Tạo nhánh: git checkout -b feature/AmazingFeature

    Commit: git commit -m 'feat: add AmazingFeature'

    Push: git push origin feature/AmazingFeature

    Mở Pull Request

Quy ước commit (Conventional Commits)

feat: · fix: · docs: · style: · refactor: · test: · chore:
📄 Giấy phép

Dự án phát hành dưới giấy phép MIT License — xem file LICENSE.
<div align="center">

🌟 RiceGuard — Bảo vệ mùa màng & Bảo vệ hệ thống 🌟

Made with ❤️ by RiceGuard Team

⬆ Về đầu trang
</div> ```
