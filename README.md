<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:16a34a,50:0ea5e9,100:7c3aed&height=220&section=header&text=RiceGuard&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Bảo%20vệ%20mùa%20màng%20•%20Bảo%20vệ%20hệ%20thống&descAlignY=60&descSize=20" alt="RiceGuard banner" />

### 🌾 Cảnh báo sớm dịch bệnh lúa từ ảnh viễn thám Sentinel-2
### 🛡️ Giám sát an ninh mạng • Phát hiện xâm nhập • Tự động cảnh báo

<br/>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-404D59?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![n8n](https://img.shields.io/badge/n8n_2.41.5-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram_Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![Status](https://img.shields.io/badge/trạng_thái-đang_phát_triển-f59e0b?style=flat-square)
![Đề tài](https://img.shields.io/badge/đề_tài-25_Cybersecurity_Automation-dc2626?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

> 💡 *Nền tảng giúp **nông dân** phát hiện sớm dịch bệnh trên lúa và giúp **quản trị viên** phát hiện, ngăn chặn tấn công vào chính hệ thống theo thời gian thực.*

</div>

---

## 🌈 Giới thiệu

**RiceGuard** gồm hai phân hệ chạy chung một nền tảng:

| | Phân hệ | Mục tiêu |
| :---: | :--- | :--- |
| 🌾 | **Nông nghiệp** | Upload ảnh lúa → AI chẩn đoán bệnh → phân tích ảnh vệ tinh → cảnh báo Telegram |
| 🛡️ | **An ninh mạng** *(trọng tâm đề tài 25)* | Phát hiện tấn công → ghi cảnh báo → tự động chặn IP → báo cáo cho quản trị viên |

---

## ✨ Tính năng nổi bật

<table>
<tr>
<td width="50%" valign="top">

### 🌾 Nông nghiệp
- 📸 Chẩn đoán bệnh lúa từ ảnh bằng Gemini AI
- 🛰️ Phân tích ảnh viễn thám Sentinel-2
- 📲 Cảnh báo cho nông dân qua Telegram
- 🗺️ Dashboard theo dõi theo vùng

</td>
<td width="50%" valign="top">

### 🛡️ An ninh mạng
- 🔎 Phát hiện 6 loại tấn công trong **một** pipeline
- 🧾 Ghi mọi cảnh báo vào PostgreSQL
- 🚫 Tự động chặn IP khi tái phạm
- 📊 Trang audit và nhật ký cho quản trị viên

</td>
</tr>
</table>

---

## 🏗️ Kiến trúc hệ thống

~~~mermaid
flowchart LR
    U([👤 Người dùng]) --> FE[🖥️ Next.js<br/>:3000]
    FE --> BE[⚙️ Node.js API<br/>:5000]
    BE --> DB[(🗄️ PostgreSQL<br/>:5432)]
    BE -- sự kiện bảo mật --> N8N{{🔄 n8n<br/>:5678}}
    N8N --> DB
    N8N --> TG[📲 Telegram]
    N8N -- chặn IP --> BE
    N8N --> AI[🤖 Gemini]

    style U fill:#16a34a,color:#fff,stroke:none
    style FE fill:#0ea5e9,color:#fff,stroke:none
    style BE fill:#7c3aed,color:#fff,stroke:none
    style DB fill:#4169E1,color:#fff,stroke:none
    style N8N fill:#EA4B71,color:#fff,stroke:none
    style TG fill:#26A5E4,color:#fff,stroke:none
    style AI fill:#8E75B2,color:#fff,stroke:none
~~~

---

## 🔥 Pipeline an ninh: một luồng, nhiều node

~~~mermaid
flowchart LR
    A[🌐 Webhook<br/>security-event] --> B[🔍 Detect Attack]
    B --> C{🚨 Detected?}
    C -- có --> D[💾 Save Alert]
    C -- không --> Z([✅ Bỏ qua])
    D --> E[🔢 Count Alerts 1h]
    E --> F[📲 Telegram Alert]
    E --> G{⚠️ ≥ 5 lần?}
    G -- có --> H[🚫 Block IP]

    style A fill:#0ea5e9,color:#fff,stroke:none
    style B fill:#f59e0b,color:#fff,stroke:none
    style C fill:#dc2626,color:#fff,stroke:none
    style D fill:#4169E1,color:#fff,stroke:none
    style E fill:#4169E1,color:#fff,stroke:none
    style F fill:#26A5E4,color:#fff,stroke:none
    style G fill:#dc2626,color:#fff,stroke:none
    style H fill:#7f1d1d,color:#fff,stroke:none
~~~

### 🎯 Các loại tấn công được phát hiện

| Mức độ | Loại tấn công | Dấu hiệu |
| :---: | :--- | :--- |
| 🟣 **Critical** | Command Injection | `; cat`, `\| bash`, `$(...)` |
| 🔴 **High** | SQL Injection | `UNION SELECT`, `OR 1=1`, `DROP TABLE` |
| 🔴 **High** | Path Traversal | `../`, `/etc/passwd` |
| 🔴 **High** | SSH Brute Force | từ 5 lần đăng nhập SSH thất bại |
| 🟠 **Medium** | XSS | `<script>`, `onerror=`, `javascript:` |
| 🟠 **Medium** | Port Scan | quét từ 10 cổng trở lên |

> Tất cả rule nằm trong **một node Code**, thêm rule mới chỉ cần thêm một dòng.

---

## 🚀 Cài đặt nhanh

<details open>
<summary><b>🖥️ Bước 1: Clone và chạy Backend + Frontend</b></summary>

~~~bash
git clone https://github.com/Chamm286/riceguard.git
cd riceguard

# ⚙️ Backend (cổng 5000)
cd backend && npm install
cp .env.example .env      # điền DB, JWT_SECRET, N8N_WEBHOOK_URL
npm run dev

# 🖥️ Frontend (cổng 3000)
cd ../frontend && npm install
npm run dev
~~~

</details>

<details>
<summary><b>🔄 Bước 2: Chạy n8n trên máy chủ</b></summary>

~~~bash
npm install -g n8n@2.41.5
export N8N_LISTEN_ADDRESS=127.0.0.1
n8n start                 # http://localhost:5678
~~~

Sau đó import `n8n-workflows/RiceGuard-Security-Pipeline.json`, gắn credential **Postgres** và **Telegram**, rồi bấm **Publish**.

</details>

<details>
<summary><b>🧪 Bước 3: Kiểm thử pipeline</b></summary>

~~~bash
curl -X POST http://localhost:5678/webhook/security-event \
  -H "Content-Type: application/json" \
  -d '{"ip":"203.0.113.50","path":"/api/login","payload":"1 OR 1=1"}'
~~~

Dùng IP `203.0.113.x` (dải dành cho tài liệu) để tránh chặn nhầm máy thật. Kết quả mong đợi: một dòng mới trong bảng `alerts` và một tin nhắn Telegram.

</details>

---

## 🔐 Biện pháp bảo mật

- ✅ Mật khẩu băm bằng **bcrypt**, phiên đăng nhập bằng **JWT**
- ✅ Header bảo mật với **helmet**
- ✅ Whitelist IP, kiểm tra định dạng IP trước khi chặn
- ✅ API key lưu trong **n8n Credentials**, không đặt trong URL
- ✅ Dịch vụ nội bộ chỉ lắng nghe trên `127.0.0.1`
- ⛔ Không commit `.env`, `credentials/`, `backup-*`, `*.sql`

---

## 📂 Cấu trúc thư mục

~~~text
riceguard/
├── 🖥️ frontend/          # Next.js (App Router)
├── ⚙️ backend/           # Node.js API
│   └── src/              # controllers, routes, middlewares, services
├── 🔄 n8n-workflows/     # workflow n8n (pipeline an ninh + nông nghiệp)
└── 📄 README.md
~~~

---

## 👥 Nhóm phát triển

<div align="center">

| 👤 Thành viên | 🎭 Vai trò |
| :--- | :--- |
| **Nguyễn Thị Bích Trâm** | 🎯 Leader, Backend |
| **Tống Mỹ Trà** | 🎨 Frontend |
| **Trần Anh Tuấn** | ⚙️ Backend |
| **Nguyễn Hữu Thuận** | 🚀 DevOps, n8n |

</div>

---

<div align="center">

📄 Phát hành theo giấy phép **MIT**

**🌾 RiceGuard: Bảo vệ mùa màng, bảo vệ hệ thống 🛡️**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,50:0ea5e9,100:16a34a&height=120&section=footer" alt="footer" />

</div>
