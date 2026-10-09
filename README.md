# 🌾 RiceGuard

Hệ thống cảnh báo sớm dịch bệnh lúa & Giám sát an ninh mạng.

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql)
![n8n](https://img.shields.io/badge/n8n-2.41-EA4B71?logo=n8n)
![Gemini](https://img.shields.io/badge/Gemini-3.8_Flash-4285F4?logo=google)

## Giới thiệu

- 🌾 **Nông nghiệp**: Chẩn đoán bệnh lúa bằng Gemini AI, phân tích vệ tinh, cảnh báo Telegram
- 🔒 **An ninh mạng**: Phát hiện tấn công, auto block IP, giám sát visitor

## Cài đặt

```bash
git clone https://github.com/Chamm286/riceguard.git
cd riceguard

cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
docker run -d --name n8n -p 5678:5678 n8nio/n8n:2.41.5
Nhóm thực hiện
Họ và tên	Vai trò
Nguyễn Thị Bích Trâm	Leader — Backend
Tống Mỹ Trà	Frontend
Trần Anh Tuấn	Backend
Nguyễn Hữu Thuận	DevOps / n8n

MIT License · Made with ❤️ by RiceGuard Team
