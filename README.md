<div align="center">

# 🌾 RiceGuard

**Nền tảng giám sát an ninh mạng, phát hiện xâm nhập và tự động cảnh báo cho hệ thống cảnh báo sớm dịch bệnh cây lúa từ ảnh viễn thám Sentinel-2**

*Đề tài 25 – Cybersecurity Automation*

</div>

---

## Giới thiệu

RiceGuard gồm hai phân hệ chạy trên cùng một nền tảng:

| Phân hệ | Mục tiêu |
| :--- | :--- |
| 🌾 Nông nghiệp | Nông dân upload ảnh lúa, AI chẩn đoán bệnh, phân tích ảnh vệ tinh, cảnh báo Telegram |
| 🔒 An ninh mạng | Phát hiện tấn công vào chính hệ thống, ghi cảnh báo, tự động chặn IP, báo cáo cho quản trị viên |

Đề tài 25 tập trung vào phân hệ **an ninh mạng**: bảo vệ web, API và dữ liệu của hệ thống cảnh báo dịch bệnh.

## Kiến trúc

~~~text
 Người dùng ──> Next.js Frontend (:3000)
                     │
                     ▼
              Node.js API (:5000) ───> PostgreSQL (:5432)
                     │
                     │  sự kiện bảo mật
                     ▼
              n8n (:5678)  webhook /security-event
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   Lưu alert     Telegram     Chặn IP (backend)
~~~

## Pipeline an ninh (một luồng n8n, nhiều node)

~~~text
Webhook ─> Detect Attack ─> Detected? ─> Save Alert ─> Count Alerts 1h ─┬─> Telegram Alert
                                                                        └─> Repeat >= 5? ─> Block IP
~~~

Node **Detect Attack** chứa toàn bộ rule: SQL Injection, XSS, Path Traversal, Command Injection, SSH Brute Force, Port Scan, kèm whitelist IP. Khi cùng một IP có từ 5 cảnh báo trong 1 giờ, hệ thống gọi backend để chặn IP đó.

## Công nghệ

| Thành phần | Công nghệ |
| :--- | :--- |
| Frontend | Next.js, TypeScript |
| Backend | Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt, helmet |
| Workflow | n8n 2.41.5 (chạy trực tiếp trên máy chủ) |
| AI | Google Gemini (qua API) |
| Cảnh báo | Telegram Bot |

## Cài đặt

~~~bash
git clone https://github.com/Chamm286/riceguard.git
cd riceguard

# Backend (cổng 5000)
cd backend && npm install
cp .env.example .env      # điền thông tin DB, JWT_SECRET, N8N_WEBHOOK_URL
npm run dev

# Frontend (cổng 3000)
cd ../frontend && npm install
npm run dev

# n8n (chạy trên máy chủ)
npm install -g n8n@2.41.5
n8n start                 # http://localhost:5678
~~~

Sau khi chạy n8n, import `n8n-workflows/RiceGuard-Security-Pipeline.json`, gắn credential Postgres và Telegram, rồi **Publish**.

## Kiểm thử

~~~bash
curl -X POST http://localhost:5678/webhook/security-event \
  -H "Content-Type: application/json" \
  -d '{"ip":"203.0.113.50","path":"/api/login","payload":"1 OR 1=1"}'
~~~

Dùng IP `203.0.113.x` (dải dành cho tài liệu) để thử, tránh chặn nhầm máy thật.

## Bảo mật

- Không commit `.env`, `credentials/`, các thư mục `backup-*`, file `*.sql` và workflow có chứa key.
- API key lưu trong n8n Credentials, không đặt trong URL.
- Các cổng dịch vụ chỉ bind `127.0.0.1`.

## Nhóm phát triển

| Họ và tên | Vai trò |
| :--- | :--- |
| Nguyễn Thị Bích Trâm | Leader, Backend |
| Tống Mỹ Trà | Frontend |
| Trần Anh Tuấn | Backend |
| Nguyễn Hữu Thuận | DevOps, n8n |

## Giấy phép

MIT License.
