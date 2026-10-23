# 🌾 RiceGuard

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![n8n](https://img.shields.io/badge/n8n-2.41-EA4B71?logo=n8n)](https://n8n.io/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Nền tảng AI + Automation giám sát an ninh mạng và cảnh báo sớm dịch bệnh cây lúa từ ảnh viễn thám Sentinel-2.

## Kiến trúc
```
User → Next.js (3000) → Node.js API (5000) → PostgreSQL (5432)
                          ↓
                         n8n (5678) → Telegram / Gmail
                          ↓
                     AI Service (5001) → Gemini / Flask
```

## Cài đặt Local
```bash
# Backend
cd backend && npm install && npm run dev
# Frontend
cd frontend && npm install && npm run dev
# AI Service
cd ai-model && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python app.py
# n8n
cd ~/n8n-safe && set -a && . ./n8n.env && set +a && n8n start
```

## Docker
```bash
docker compose up -d
```

## Test nhanh
```bash
# Security event
curl -X POST http://localhost:5678/webhook/security-event \
  -H 'Content-Type: application/json' \
  -d '{"ip":"7.7.7.7","path":"/?id=1 union select","payload":"union select","user_agent":"sqlmap"}'

# Rice report
IMG=$(ls backend/uploads | head -1)
curl -X POST http://localhost:5678/webhook/new-report \
  -H 'Content-Type: application/json' \
  -d "{\"id\":999,\"user_id\":1,\"title\":\"test leaf\",\"description\":\"test\",\"image_url\":\"/uploads/$IMG\"}"
```

## Luồng n8n (4 luồng chính)
1. **SOC Alert Triage** – phát hiện tấn công, block IP, cảnh báo Telegram.
2. **Rice Disease Diagnosis** – phân tích ảnh lá lúa, cảnh báo nông dân.
3. **Sentinel-2 Sync** – đồng bộ vệ tinh, NDVI/NDRE, dự đoán.
4. **Daily Security Report** – báo cáo 24h, Telegram + Gmail.

## Cấu hình Telegram/Gmail
- Telegram node: chatId `7893336271`, credential Telegram account.
- Gmail node: credential Gmail (email + app password).

## Tính năng AI
- Flask AI service phân tích ảnh lá lúa và dữ liệu Sentinel-2.
- Dashboard hiển thị AI summary từ `alerts_summary`.

## Ports
- Frontend: 3000
- Backend: 5000
- AI Service: 5001
- n8n: 5678
- PostgreSQL: 5432
