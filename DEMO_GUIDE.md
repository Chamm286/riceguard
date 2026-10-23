# RiceGuard – Demo Guide

## 1. Khởi động
```bash
# Backend
cd backend && npm install && npm run dev
# Frontend
cd frontend && npm install && npm run dev
# AI service
cd ai-model && python -m venv venv && source venv/bin/activate && pip install flask pillow numpy earthengine-api && python app.py
# n8n (host)
cd ~/n8n-safe && set -a && . ./n8n.env && set +a && n8n start
```

## 2. Import & Active n8n
1. Mở http://localhost:5678
2. Workflows -> Import from File -> chọn `n8n-workflows/MASTER_4FLOWS_16NODES.json`
3. Mở từng workflow -> bấm **Active**
4. Test webhook:
```bash
curl -X POST http://localhost:5678/webhook/security-event \
  -H 'Content-Type: application/json' \
  -d '{"ip":"9.9.9.9","path":"/?id=1 union select","payload":"union select","user_agent":"sqlmap"}'
```

## 3. Xem dữ liệu chảy
- BE log: terminal backend
- DB: `psql -U riceguard_user -d riceguard -c "SELECT * FROM alerts ORDER BY id DESC LIMIT 5;"`
- FE: F12 Network, màn hình `/alerts`, `/dashboard`, `/logs`
- Telegram: bot chat nhận cảnh báo

## 4. Kịch bản thuyết trình
1. Giới thiệu RiceGuard 2 lớp: Nông nghiệp + An ninh mạng.
2. Upload ảnh lá lúa -> n8n phân tích -> DB -> Telegram.
3. Giả lập SQLi -> n8n block IP -> Telegram.
4. Mở Dashboard/Alerts/Logs -> dữ liệu realtime.
5. Mở n8n -> chỉ 4 luồng 16 node.

## 5. Git & PR
```bash
git checkout -b feat/sync-n8n-fe-be
git add .
git commit -m "feat(n8n): sync 4 core flows with BE/FE and realtime logs"
git push origin feat/sync-n8n-fe-be
```
Tạo PR trên GitHub: base `main`, compare `feat/sync-n8n-fe-be`.
