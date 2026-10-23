<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:059669,35:0ea5e9,70:6366f1,100:a21caf&height=260&section=header&text=RiceGuard&fontSize=80&fontColor=ffffff&animation=twinkling&fontAlignY=36&desc=Security%20Automation%20Platform%20•%20Rice%20Disease%20Early%20Warning&descAlignY=58&descSize=20" alt="RiceGuard" />

<h3>🛡️ Giám sát an ninh mạng &nbsp;•&nbsp; 🔎 Phát hiện xâm nhập &nbsp;•&nbsp; ⚡ Tự động cảnh báo</h3>
<p><i>cho hệ thống cảnh báo sớm dịch bệnh cây lúa từ ảnh viễn thám Sentinel-2</i></p>

<br/>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-404D59?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![n8n](https://img.shields.io/badge/n8n_2.41.5-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-D63AFF?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![Status](https://img.shields.io/badge/trạng_thái-đang_phát_triển-f59e0b?style=flat-square&labelColor=1f2937)
![Topic](https://img.shields.io/badge/đề_tài-25_Cybersecurity_Automation-ef4444?style=flat-square&labelColor=1f2937)
![Detect](https://img.shields.io/badge/loại_tấn_công-6-8b5cf6?style=flat-square&labelColor=1f2937)
![n8n](https://img.shields.io/badge/pipeline-1_workflow_·_8_node-10b981?style=flat-square&labelColor=1f2937)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square&labelColor=1f2937)

<br/>

**[🌈 Tổng quan](#-tổng-quan)** · **[🏗️ Kiến trúc](#️-kiến-trúc-hệ-thống)** · **[🔥 Pipeline](#-pipeline-an-ninh)** · **[🚀 Cài đặt](#-hướng-dẫn-cài-đặt-từng-bước)** · **[🧪 Kiểm thử](#-bước-8-kiểm-thử)** · **[🩺 Xử lý lỗi](#-xử-lý-lỗi-thường-gặp)** · **[🗺️ Lộ trình](#️-lộ-trình)**

</div>

---

## 🌈 Tổng quan

> [!IMPORTANT]
> Hệ thống cảnh báo dịch bệnh lúa lưu dữ liệu vùng trồng, tài khoản người dùng và quyền gửi cảnh báo tới nông dân. Nếu bị tấn công, hậu quả không chỉ là mất dữ liệu: **cảnh báo giả hoặc bị chặn có thể dẫn đến quyết định phun thuốc sai.**

**RiceGuard** gồm hai phân hệ chạy trên cùng một nền tảng:

<table>
<tr>
<td width="50%" valign="top">

### 🌾 Phân hệ Nông nghiệp
- 📸 Upload ảnh lúa, AI chẩn đoán bệnh
- 🛰️ Phân tích ảnh viễn thám Sentinel-2
- 📲 Cảnh báo nông dân qua Telegram
- 🗺️ Dashboard theo vùng

</td>
<td width="50%" valign="top">

### 🛡️ Phân hệ An ninh mạng ⭐
*Trọng tâm đề tài 25*
- 🔎 Phát hiện **6 nhóm tấn công** trong **một** pipeline
- 🧾 Ghi mọi cảnh báo vào PostgreSQL
- 🚫 Tự động yêu cầu chặn IP khi tái phạm
- 📊 Trang audit và nhật ký cho quản trị viên

</td>
</tr>
</table>

| 🎯 Trong phạm vi | 🚧 Ngoài phạm vi |
| :--- | :--- |
| Bảo vệ web, API và dữ liệu của hệ thống | Thuật toán chẩn đoán bệnh lúa |
| Phát hiện xâm nhập, phản ứng tự động | Hạ tầng mạng vật lý, DDoS lưu lượng lớn |

---

## 🏗️ Kiến trúc hệ thống

~~~mermaid
flowchart LR
    U([👤 Người dùng]) --> FE[🖥️ Next.js<br/>:3000]
    FE --> BE[⚙️ Node.js API<br/>:5000]
    BE --> DB[(🗄️ PostgreSQL<br/>:5432)]
    BE -- "📡 sự kiện bảo mật" --> N8N{{🔄 n8n<br/>:5678}}
    N8N -- "💾 ghi alert" --> DB
    N8N -- "📲 thông báo" --> TG[Telegram Bot]
    N8N -- "🚫 chặn IP" --> BE

    style U fill:#059669,color:#fff,stroke:none
    style FE fill:#0ea5e9,color:#fff,stroke:none
    style BE fill:#6366f1,color:#fff,stroke:none
    style DB fill:#4169E1,color:#fff,stroke:none
    style N8N fill:#EA4B71,color:#fff,stroke:none
    style TG fill:#26A5E4,color:#fff,stroke:none
~~~

| 🧱 Lớp | 🛠️ Công nghệ | 🔌 Cổng | 📌 Vai trò |
| :--- | :--- | :---: | :--- |
| Presentation | Next.js, TypeScript | `3000` | Giao diện nông dân và quản trị viên |
| Application | Node.js, Express, JWT, helmet | `5000` | API, xác thực, phân quyền, thu thập sự kiện |
| Orchestration | n8n 2.41.5 | `5678` | Phát hiện, phân loại, phản ứng tự động |
| Data | PostgreSQL | `5432` | Cảnh báo, người dùng, nhật ký |
| Notification | Telegram Bot API | n/a | Cảnh báo thời gian thực |

---

## 🔥 Pipeline an ninh

Toàn bộ logic nằm trong **một workflow n8n** (`RiceGuard | Security Pipeline`, 8 node), thay cho việc tách mỗi loại tấn công thành một workflow riêng.

~~~mermaid
flowchart LR
    A[🌐 Webhook<br/>security-event] --> B[🔍 Detect Attack]
    B --> C{🚨 Detected?}
    C -- không --> Z([✅ Bỏ qua])
    C -- có --> D[💾 Save Alert]
    D --> E[🔢 Count Alerts 1h]
    E --> F[📲 Telegram Alert]
    E --> G{⚠️ ≥ 5 lần / giờ?}
    G -- có --> H[🚫 Block IP]

    style A fill:#0ea5e9,color:#fff,stroke:none
    style B fill:#f59e0b,color:#fff,stroke:none
    style C fill:#ef4444,color:#fff,stroke:none
    style D fill:#4169E1,color:#fff,stroke:none
    style E fill:#4169E1,color:#fff,stroke:none
    style F fill:#26A5E4,color:#fff,stroke:none
    style G fill:#ef4444,color:#fff,stroke:none
    style H fill:#7f1d1d,color:#fff,stroke:none
    style Z fill:#10b981,color:#fff,stroke:none
~~~

### 🎯 Rule phát hiện

| 🚦 Mức độ | 🕵️ Loại tấn công | 🧩 Điều kiện kích hoạt |
| :---: | :--- | :--- |
| 🟣 **Critical** | Command Injection | `; cat`, `\| bash`, `` `cmd` ``, `$(...)` |
| 🔴 **High** | SQL Injection | `UNION SELECT`, `OR 1=1`, `; DROP TABLE`, `sleep()` |
| 🔴 **High** | Path Traversal | `../`, `%2e%2e`, `/etc/passwd` |
| 🔴 **High** | SSH Brute Force | `event=ssh_failed` và `failed_count ≥ 5` |
| 🟠 **Medium** | XSS | `<script`, `onerror=`, `javascript:` |
| 🟠 **Medium** | Port Scan | `event=port_scan` và `ports_count ≥ 10` |

### ⚙️ Ma trận phản ứng

| 🔔 Điều kiện | 🤖 Hành động tự động |
| :--- | :--- |
| Sự kiện khớp rule | Ghi bảng `alerts` và gửi Telegram |
| IP thuộc whitelist hoặc sai định dạng | Bỏ qua, không sinh cảnh báo |
| Cùng IP, từ 5 cảnh báo trong 1 giờ | Gọi backend để chặn IP |

---

## 🚀 Hướng dẫn cài đặt từng bước

> [!NOTE]
> Hướng dẫn viết cho **Ubuntu/Linux**. Tổng thời gian khoảng 20 đến 30 phút (n8n cài mất vài phút).

### 📋 Bước 0: Yêu cầu

| 🧰 Công cụ | 📏 Phiên bản | 🔎 Kiểm tra |
| :--- | :---: | :--- |
| Node.js | ≥ 20.19 (khuyến nghị 22 trở lên) | `node -v` |
| npm | đi kèm Node.js | `npm -v` |
| PostgreSQL | bản ổn định mới | `psql --version` |
| Git | bất kỳ | `git --version` |

Ngoài ra cần một **Telegram Bot** (tạo qua [@BotFather](https://t.me/BotFather) để lấy token) và chat ID của bạn (nhắn [@userinfobot](https://t.me/userinfobot)).

---

<details open>
<summary><h3>📥 Bước 1: Tải mã nguồn</h3></summary>

~~~bash
git clone https://github.com/Chamm286/riceguard.git
cd riceguard
~~~

</details>

<details open>
<summary><h3>🗄️ Bước 2: Tạo cơ sở dữ liệu</h3></summary>

~~~bash
sudo -u postgres psql <<'SQL'
CREATE USER riceguard_user WITH PASSWORD 'DOI_MAT_KHAU_MANH';
CREATE DATABASE riceguard OWNER riceguard_user;
SQL
~~~

Nạp cấu trúc bảng (file `docs/schema.sql`, xuất từ máy gốc bằng `pg_dump --schema-only`):

~~~bash
psql -h localhost -U riceguard_user -d riceguard -f docs/schema.sql
~~~

Kiểm tra bảng cảnh báo đã có:

~~~bash
psql -h localhost -U riceguard_user -d riceguard -c "\d alerts"
~~~

> [!WARNING]
> Đổi `DOI_MAT_KHAU_MANH` thành mật khẩu mạnh của riêng bạn. Không dùng lại mật khẩu mẫu.

</details>

<details open>
<summary><h3>⚙️ Bước 3: Cấu hình và chạy Backend</h3></summary>

~~~bash
cd backend
npm install
cp .env.example .env
~~~

Mở `.env` và điền (chỉ điền **một** dòng `N8N_WEBHOOK_URL`):

~~~env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=riceguard
DB_USER=riceguard_user
DB_PASSWORD=DOI_MAT_KHAU_MANH

JWT_SECRET=chuoi_ngau_nhien_dai_it_nhat_32_ky_tu
JWT_EXPIRES_IN=1d

N8N_WEBHOOK_URL=http://localhost:5678/webhook
~~~

Tạo `JWT_SECRET` ngẫu nhiên:

~~~bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
~~~

Chạy:

~~~bash
npm run dev          # http://localhost:5000
~~~

> [!TIP]
> Giữ mỗi dịch vụ ở một cửa sổ terminal riêng để dễ xem log.

</details>

<details open>
<summary><h3>🖥️ Bước 4: Chạy Frontend</h3></summary>

~~~bash
cd ../frontend
npm install
~~~

Tạo `.env.local`:

~~~env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
~~~

~~~bash
npm run dev          # http://localhost:3000
~~~

</details>

<details open>
<summary><h3>🔄 Bước 5: Cài và chạy n8n trên máy chủ</h3></summary>

~~~bash
npm install -g n8n@2.41.5
export N8N_LISTEN_ADDRESS=127.0.0.1
n8n start            # http://localhost:5678
~~~

Lần đầu mở trình duyệt, n8n yêu cầu tạo tài khoản chủ sở hữu.

> [!IMPORTANT]
> `N8N_LISTEN_ADDRESS=127.0.0.1` giúp n8n chỉ nhận kết nối từ chính máy này, không mở ra mạng ngoài.

</details>

<details open>
<summary><h3>🔑 Bước 6: Tạo credential trong n8n</h3></summary>

Vào **Credentials → Create credential** và tạo hai mục:

| 🔐 Credential | 📝 Thông tin điền |
| :--- | :--- |
| **Postgres** | Host `localhost`, Port `5432`, Database `riceguard`, User `riceguard_user`, mật khẩu như Bước 2 |
| **Telegram API** | Access Token lấy từ @BotFather |

> [!CAUTION]
> API key (Gemini và các khóa khác) chỉ lưu trong **n8n Credentials**. **Không** đặt key trong URL của node hay trong file workflow, vì file này có thể bị commit lên GitHub.

</details>

<details open>
<summary><h3>📦 Bước 7: Import và bật pipeline</h3></summary>

1. Trong n8n bấm **Create workflow**, rồi menu `...` → **Import from file**.
2. Chọn `n8n-workflows/RiceGuard-Security-Pipeline.json`.
3. Bấm đúp từng node có cảnh báo đỏ và gắn credential:
   - **Save Alert**, **Count Alerts 1h**: chọn credential Postgres.
   - **Telegram Alert**: chọn credential Telegram, thay `THAY_CHAT_ID` bằng chat ID của bạn.
   - **Block IP**: thay `DOI_SAU` bằng secret dùng chung với backend.
4. Bấm **Save**, rồi **Publish**.

> [!WARNING]
> Hai workflow không được dùng chung một đường dẫn webhook. Nếu n8n báo **Conflicting Webhook Path**, hãy **Unpublish** workflow đang giữ đường dẫn `security-event`, rồi Publish lại workflow này.

</details>

<details open>
<summary><h3>🧪 Bước 8: Kiểm thử</h3></summary>

Gửi một sự kiện giả lập (dùng IP trong dải tài liệu `203.0.113.0/24` để không chặn nhầm máy thật):

~~~bash
curl -X POST http://localhost:5678/webhook/security-event \
  -H "Content-Type: application/json" \
  -d '{"ip":"203.0.113.50","path":"/api/login","payload":"1 OR 1=1"}'
~~~

**Kết quả đúng:**

| ✅ Kiểm tra | 🔍 Cách xem |
| :--- | :--- |
| Phản hồi `{"message":"Workflow was started"}` | Kết quả của lệnh `curl` |
| Có dòng `sql_injection` mới trong bảng | `psql -h localhost -U riceguard_user -d riceguard -c "SELECT id, alert_type, severity, ip_address FROM alerts WHERE category='security' ORDER BY id DESC LIMIT 3;"` |
| Nhận tin nhắn Telegram | Mở ứng dụng Telegram |
| Mọi node màu xanh | n8n → workflow → tab **Executions** |

Thử các loại tấn công còn lại:

~~~bash
U=http://localhost:5678/webhook/security-event; H='Content-Type: application/json'
curl -s -X POST $U -H "$H" -d '{"ip":"203.0.113.51","path":"/search","payload":"<script>alert(1)</script>"}'; echo
curl -s -X POST $U -H "$H" -d '{"ip":"203.0.113.52","path":"/files?f=../../etc/passwd"}'; echo
curl -s -X POST $U -H "$H" -d '{"ip":"203.0.113.53","event":"ssh_failed","failed_count":8}'; echo
curl -s -X POST $U -H "$H" -d '{"ip":"127.0.0.1","path":"/x","payload":"1 OR 1=1"}'; echo   # whitelist: KHÔNG sinh alert
~~~

Thử cơ chế chặn IP (gửi cùng một IP 5 lần):

~~~bash
for i in 1 2 3 4 5; do curl -s -X POST $U -H "$H" -d '{"ip":"203.0.113.60","path":"/login","payload":"1 OR 1=1"}'; echo; done
~~~

</details>

---

## 🩺 Xử lý lỗi thường gặp

| 🚨 Hiện tượng | 🔎 Nguyên nhân thường gặp | 🛠️ Cách xử lý |
| :--- | :--- | :--- |
| `curl` trả **404** `webhook not registered` | Workflow chưa Publish, hoặc sai đường dẫn | Publish workflow, dùng `/webhook/` (không phải `/webhook-test/`) |
| n8n báo **Conflicting Webhook Path** | Workflow khác đang giữ đường dẫn | Unpublish workflow đó rồi Publish lại |
| `curl` trả **500** `No item to return was found` | Webhook đang chờ node cuối trả dữ liệu | Đặt **Respond** của node Webhook thành **Immediately** |
| Bảng `alerts` trống dù `curl` thành công | Node Postgres chưa gắn credential, hoặc trỏ nhầm database | Mở node Save Alert, kiểm tra credential; xem tab **Executions** |
| Node Postgres lỗi kết nối | Sai Host, mật khẩu, hoặc `pg_hba.conf` | Dùng Host `localhost` khi n8n chạy trên máy chủ |
| Node Block IP lỗi `ECONNREFUSED` | Backend chưa chạy | Chạy `npm run dev` trong `backend/` |
| `npm` báo `EACCES` khi cài n8n | Thiếu quyền thư mục global | Chạy lại với `sudo`, hoặc dùng `nvm` |
| Publish báo *someone else just updated* | Mở cùng workflow ở nhiều tab | Đóng tab dư, nhấn **F5** rồi Publish lại |

---

## 🔐 Trạng thái bảo mật

| 🛡️ Hạng mục | 📊 Trạng thái |
| :--- | :---: |
| Băm mật khẩu bcrypt, phiên JWT | ✅ Đã triển khai |
| Header bảo mật (helmet) | ✅ Đã triển khai |
| n8n chỉ lắng nghe `127.0.0.1` | ✅ Đã triển khai |
| Whitelist IP, kiểm tra định dạng IP | ✅ Đã triển khai |
| Secret dùng chung cho endpoint n8n gọi vào backend | 🔧 Đang thực hiện |
| Giới hạn tốc độ đăng nhập (`express-rate-limit`) | 🔧 Đang thực hiện |
| Chuyển API key sang n8n Credentials | 🔧 Đang thực hiện |
| Xác thực cho webhook nhận sự kiện | 📋 Kế hoạch |
| Chặn IP có thời hạn tự hết | 📋 Kế hoạch |
| Bind PostgreSQL về loopback | 📋 Kế hoạch |

> [!CAUTION]
> **Không commit** `.env`, `credentials/`, `backup-*/`, `*.sql` và các workflow chứa khóa. Khóa nào đã lộ phải **thu hồi và cấp mới**.

---

## 📈 Đánh giá thực nghiệm

Các chỉ số sẽ được điền sau khi chạy bộ kiểm thử tấn công (script brute-force, SQLMap, OWASP ZAP).

| 📏 Chỉ số | 🎯 Mục tiêu | 📝 Kết quả |
| :--- | :---: | :---: |
| Tỷ lệ phát hiện đúng (TPR) | ≥ 95% | _chờ đo_ |
| Tỷ lệ cảnh báo sai (FPR) | ≤ 5% | _chờ đo_ |
| Độ trễ từ sự kiện đến Telegram | ≤ 5 giây | _chờ đo_ |
| Từ cảnh báo thứ 5 đến chặn IP | ≤ 10 giây | _chờ đo_ |

---

## 🗺️ Lộ trình

- [x] 🧩 Gộp các detector thành một pipeline
- [x] 🏠 n8n chạy trên máy chủ, bind loopback
- [ ] 📡 Middleware backend gửi sự kiện vào `/webhook/security-event`
- [ ] 📅 Nhánh báo cáo ngày và tổng hợp AI (Schedule trigger) trong cùng workflow
- [ ] 📊 Dashboard SOC: biểu đồ sự kiện theo thời gian, top IP
- [ ] 🧪 Bộ kiểm thử tấn công tự động và báo cáo chỉ số

---

## 👥 Nhóm phát triển

<div align="center">

| 👤 Thành viên | 🎭 Vai trò |
| :--- | :--- |
| **Nguyễn Thị Bích Trâm** | 🎯 Trưởng nhóm, Backend |
| **Tống Mỹ Trà** | 🎨 Frontend |
| **Trần Anh Tuấn** | ⚙️ Backend |
| **Nguyễn Hữu Thuận** | 🚀 DevOps, n8n |

</div>

---

<div align="center">

📄 Phát hành theo giấy phép **MIT**

**🌾 RiceGuard: Bảo vệ mùa màng, bảo vệ hệ thống 🛡️**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a21caf,35:6366f1,70:0ea5e9,100:059669&height=140&section=footer" alt="" />

</div>
