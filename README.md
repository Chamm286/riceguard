<div align="center">

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,100:1e3a8a&height=170&section=header&text=RiceGuard&fontSize=60&fontColor=ffffff&desc=Security%20Automation%20Platform%20for%20Rice%20Disease%20Early%20Warning&descSize=17&descAlignY=72&fontAlignY=38" alt="RiceGuard" />

**Nền tảng giám sát an ninh mạng, phát hiện xâm nhập và tự động cảnh báo**
**cho hệ thống cảnh báo sớm dịch bệnh cây lúa từ ảnh viễn thám Sentinel-2**

<br/>

![Next.js](https://img.shields.io/badge/Next.js-0f172a?style=flat-square&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-0f172a?style=flat-square&logo=nodedotjs&logoColor=339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-0f172a?style=flat-square&logo=postgresql&logoColor=4169E1)
![n8n](https://img.shields.io/badge/n8n_2.41.5-0f172a?style=flat-square&logo=n8n&logoColor=EA4B71)
![Gemini](https://img.shields.io/badge/Google_Gemini-0f172a?style=flat-square&logo=googlegemini&logoColor=8E75B2)
![Telegram](https://img.shields.io/badge/Telegram-0f172a?style=flat-square&logo=telegram&logoColor=26A5E4)
![Status](https://img.shields.io/badge/status-active_development-1e3a8a?style=flat-square)
![Topic](https://img.shields.io/badge/topic-25_·_Cybersecurity_Automation-1e3a8a?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-1e3a8a?style=flat-square)

[Tổng quan](#1-tổng-quan) ·
[Kiến trúc](#2-kiến-trúc-hệ-thống) ·
[Pipeline an ninh](#3-pipeline-an-ninh) ·
[Hợp đồng API](#4-hợp-đồng-api) ·
[Triển khai](#6-triển-khai) ·
[Hardening](#7-hardening-và-trạng-thái-bảo-mật) ·
[Lộ trình](#9-lộ-trình)

</div>

---

## 1. Tổng quan

### Bài toán

Hệ thống cảnh báo sớm dịch bệnh lúa thu thập ảnh từ nông dân và ảnh viễn thám Sentinel-2, nên lưu trữ dữ liệu vùng trồng, thông tin người dùng và quyền gửi cảnh báo tới nông dân. Nếu bị tấn công, hậu quả không chỉ là mất dữ liệu: **cảnh báo giả hoặc bị chặn có thể dẫn đến quyết định phun thuốc sai**.

### Giải pháp

RiceGuard bổ sung một lớp **giám sát và phản ứng tự động** cho chính nền tảng này:

| Năng lực | Mô tả |
| :--- | :--- |
| **Phát hiện** | Nhận diện 6 nhóm tấn công từ sự kiện web, API và hệ điều hành |
| **Phân loại** | Gán mức độ nghiêng trọng (medium, high, critical) theo từng rule |
| **Lưu vết** | Ghi mọi cảnh báo vào PostgreSQL phục vụ điều tra và kiểm toán |
| **Phản ứng** | Thông báo Telegram ngay lập tức; tự động yêu cầu chặn IP khi tái phạm |
| **Giám sát** | Dashboard quản trị với trang audit và nhật ký |

### Phạm vi

| Trong phạm vi (Đề tài 25) | Ngoài phạm vi |
| :--- | :--- |
| Bảo vệ web, API, cơ sở dữ liệu của hệ thống | Thuật toán chẩn đoán bệnh lúa (phân hệ nông nghiệp) |
| Phát hiện xâm nhập và phản ứng tự động | Bảo vệ hạ tầng mạng vật lý, DDoS volumetric |

---

## 2. Kiến trúc hệ thống

~~~mermaid
flowchart LR
    U([Người dùng]) --> FE[Next.js<br/>:3000]
    FE --> BE[Node.js API<br/>:5000]
    BE --> DB[(PostgreSQL<br/>:5432)]
    BE -- "sự kiện bảo mật" --> N8N{{n8n<br/>:5678}}
    N8N -- "ghi alert" --> DB
    N8N -- "thông báo" --> TG[Telegram Bot]
    N8N -- "yêu cầu chặn IP" --> BE

    classDef core fill:#0f172a,color:#fff,stroke:#1e3a8a,stroke-width:2px
    classDef ext fill:#1e3a8a,color:#fff,stroke:none
    class FE,BE,DB,N8N core
    class TG,U ext
~~~

| Lớp | Công nghệ | Cổng | Vai trò |
| :--- | :--- | :---: | :--- |
| Presentation | Next.js, TypeScript | 3000 | Giao diện nông dân và quản trị viên |
| Application | Node.js, Express, JWT, helmet | 5000 | API, xác thực, phân quyền, thu thập sự kiện |
| Orchestration | n8n 2.41.5 | 5678 | Phát hiện, phân loại, phản ứng tự động |
| Data | PostgreSQL | 5432 | Cảnh báo, người dùng, nhật ký |
| Notification | Telegram Bot API | n/a | Cảnh báo thời gian thực |

---

## 3. Pipeline an ninh

Toàn bộ logic nằm trong **một workflow n8n** (`RiceGuard | Security Pipeline`), thay cho việc tách mỗi loại tấn công thành một workflow riêng.

~~~mermaid
flowchart LR
    A[Webhook<br/>security-event] --> B[Detect Attack]
    B --> C{Detected?}
    C -- không --> Z([Bỏ qua])
    C -- có --> D[Save Alert]
    D --> E[Count Alerts 1h]
    E --> F[Telegram Alert]
    E --> G{≥ 5 lần / giờ?}
    G -- có --> H[Block IP]

    classDef n fill:#0f172a,color:#fff,stroke:#1e3a8a
    classDef d fill:#7f1d1d,color:#fff,stroke:#991b1b
    class A,B,D,E,F,H n
    class C,G d
~~~

### 3.1 Rule phát hiện

| Mức độ | Loại tấn công | Điều kiện kích hoạt |
| :---: | :--- | :--- |
| **Critical** | Command Injection | `; cat`, `\| bash`, `` `cmd` ``, `$(...)` |
| **High** | SQL Injection | `UNION SELECT`, `OR 1=1`, `; DROP TABLE`, `sleep()` |
| **High** | Path Traversal | `../`, `%2e%2e`, `/etc/passwd` |
| **High** | SSH Brute Force | `event=ssh_failed` và `failed_count ≥ 5` |
| **Medium** | XSS | `<script`, `onerror=`, `javascript:` |
| **Medium** | Port Scan | `event=port_scan` và `ports_count ≥ 10` |

Các rule nằm trong một node Code duy nhất; thêm rule mới chỉ cần thêm một phần tử vào mảng `RULES`.

### 3.2 Ma trận phản ứng

| Điều kiện | Hành động tự động |
| :--- | :--- |
| Sự kiện khớp rule | Ghi `alerts` và gửi Telegram |
| IP thuộc whitelist hoặc sai định dạng | Bỏ qua, không sinh cảnh báo |
| Cùng IP, từ 5 cảnh báo trong 1 giờ | Gọi backend để chặn IP |

---

## 4. Hợp đồng API

### Webhook thu thập sự kiện

`POST /webhook/security-event`

~~~json
{
  "ip": "203.0.113.50",
  "path": "/api/login",
  "payload": "1 OR 1=1",
  "user_agent": "curl/8.5",
  "event": "ssh_failed",
  "failed_count": 8,
  "ports_count": 12
}
~~~

| Trường | Bắt buộc | Mô tả |
| :--- | :---: | :--- |
| `ip` | ✔ | Địa chỉ IP nguồn (IPv4 hoặc IPv6) |
| `path`, `payload`, `query`, `user_agent` | | Nội dung được quét bằng rule dạng chuỗi |
| `event` | | `ssh_failed` hoặc `port_scan` cho rule theo số lượng |
| `failed_count`, `ports_count` | | Ngưỡng đếm tương ứng với `event` |

**Phản hồi:** `200 {"message":"Workflow was started"}`. Webhook trả lời ngay, việc xử lý chạy nền.

---

## 5. Mô hình dữ liệu

Bảng trung tâm: `alerts`

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `id` | integer, PK | |
| `alert_type` | varchar(50), NOT NULL | `sql_injection`, `xss`, ... |
| `category` | varchar(50) | `security` cho cảnh báo an ninh |
| `severity` | varchar(20), NOT NULL | `medium`, `high`, `critical` |
| `title`, `description` | varchar(200), text | Nội dung cảnh báo |
| `ip_address` | varchar(45) | IP nguồn |
| `status` | varchar(20) | Mặc định `new` |
| `telegram_sent`, `notified_at` | boolean, timestamptz | Trạng thái thông báo |
| `created_at`, `updated_at` | timestamp | |

---

## 6. Triển khai

### Yêu cầu

Node.js, PostgreSQL, Git. n8n chạy trực tiếp trên máy chủ.

### Cài đặt

~~~bash
git clone https://github.com/Chamm286/riceguard.git
cd riceguard

# Backend (cổng 5000)
cd backend && npm install
cp .env.example .env        # điền DB, JWT_SECRET, N8N_WEBHOOK_URL
npm run dev

# Frontend (cổng 3000)
cd ../frontend && npm install && npm run dev

# n8n (cổng 5678, chỉ lắng nghe loopback)
npm install -g n8n@2.41.5
export N8N_LISTEN_ADDRESS=127.0.0.1
n8n start
~~~

### Kích hoạt pipeline

1. Mở `http://localhost:5678`, **Import from file**: `n8n-workflows/RiceGuard-Security-Pipeline.json`.
2. Gắn credential **Postgres** (Host `localhost`) và **Telegram**; thay `THAY_CHAT_ID`.
3. **Save**, rồi **Publish**.

### Kiểm thử

~~~bash
curl -X POST http://localhost:5678/webhook/security-event \
  -H "Content-Type: application/json" \
  -d '{"ip":"203.0.113.50","path":"/api/login","payload":"1 OR 1=1"}'
~~~

Dùng dải `203.0.113.0/24` (dành cho tài liệu, RFC 5737) để không chặn nhầm máy thật. Kết quả mong đợi: một dòng mới trong `alerts` và một tin nhắn Telegram.

---

## 7. Hardening và trạng thái bảo mật

| Hạng mục | Trạng thái |
| :--- | :---: |
| Băm mật khẩu bcrypt, phiên JWT | ✅ Đã triển khai |
| Header bảo mật (helmet) | ✅ Đã triển khai |
| n8n chỉ lắng nghe `127.0.0.1` | ✅ Đã triển khai |
| Whitelist IP, kiểm tra định dạng IP | ✅ Đã triển khai |
| Secret dùng chung cho endpoint n8n gọi vào backend | 🔧 Đang thực hiện |
| Giới hạn tốc độ đăng nhập (`express-rate-limit`) | 🔧 Đang thực hiện |
| Chuyển API key sang n8n Credentials, bỏ khỏi URL | 🔧 Đang thực hiện |
| Xác thực cho webhook nhận sự kiện | 📋 Kế hoạch |
| Chặn IP có thời hạn tự hết | 📋 Kế hoạch |
| Bind PostgreSQL và pgAdmin về loopback | 📋 Kế hoạch |

> **Quy tắc kho mã:** không commit `.env`, `credentials/`, `backup-*/`, `*.sql` và các workflow có chứa khóa. Mọi khóa lộ phải được thu hồi và cấp mới.

---

## 8. Đánh giá thực nghiệm

Các chỉ số dưới đây sẽ được điền sau khi chạy bộ kiểm thử tấn công (script brute-force, SQLMap, OWASP ZAP).

| Chỉ số | Mục tiêu | Kết quả |
| :--- | :---: | :---: |
| Tỷ lệ phát hiện đúng (TPR) | ≥ 95% | _chờ đo_ |
| Tỷ lệ cảnh báo sai (FPR) | ≤ 5% | _chờ đo_ |
| Độ trễ từ sự kiện đến Telegram | ≤ 5 giây | _chờ đo_ |
| Thời gian từ cảnh báo thứ 5 đến chặn IP | ≤ 10 giây | _chờ đo_ |

---

## 9. Lộ trình

- [x] Pipeline phát hiện gộp thành một workflow
- [x] n8n chạy trên máy chủ, bind loopback
- [ ] Middleware backend gửi sự kiện vào `/webhook/security-event`
- [ ] Nhánh báo cáo ngày và tổng hợp AI (Schedule trigger) trong cùng workflow
- [ ] Dashboard SOC: biểu đồ sự kiện theo thời gian, top IP
- [ ] Bộ kiểm thử tấn công tự động và báo cáo chỉ số

---

## 10. Nhóm phát triển

| Thành viên | Vai trò |
| :--- | :--- |
| **Nguyễn Thị Bích Trâm** | Trưởng nhóm, Backend |
| **Tống Mỹ Trà** | Frontend |
| **Trần Anh Tuấn** | Backend |
| **Nguyễn Hữu Thuận** | DevOps, n8n |

---

<div align="center">

Phát hành theo giấy phép **MIT** · Đồ án môn học, Trường CNTT & Truyền thông Việt Hàn (VKU)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1e3a8a,100:0f172a&height=60&section=footer" alt="" />

</div>
