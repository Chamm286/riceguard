# Hướng dẫn Deploy RiceGuard lên VPS Ubuntu

## 1. Cài Docker & Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 2. Cài Nginx & Certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo systemctl enable nginx
```

## 3. Clone code & cấu hình
```bash
cd /opt
sudo git clone https://github.com/Chamm286/riceguard.git
cd riceguard
sudo chown -R $USER:$USER .
cp .env.example .env 2>/dev/null || true
# Chỉnh .env: DB_PASSWORD, JWT_SECRET, N8N_API_KEY
nano .env
```

## 4. Cài Nginx config
```bash
sudo cp nginx/cham164.id.vn.conf /etc/nginx/sites-available/cham164.id.vn
sudo ln -s /etc/nginx/sites-available/cham164.id.vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Cấp SSL (HTTPS) cho 3 domain
```bash
sudo certbot --nginx -d cham164.id.vn -d www.cham164.id.vn -d api.cham164.id.vn -d n8n.cham164.id.vn
```

## 6. Chạy hệ thống 24/24
```bash
cd /opt/riceguard
docker compose up -d --build
docker compose ps
docker compose logs -f
```

## 7. Kiểm tra
- Frontend: https://cham164.id.vn
- Backend: https://api.cham164.id.vn/api/health
- n8n: https://n8n.cham164.id.vn

## 8. Backup & restart
```bash
# Restart
docker compose restart
# Stop
docker compose down
# Update code
git pull && docker compose up -d --build
# Backup DB
docker exec riceguard-postgres pg_dump -U riceguard_user riceguard > backup.sql
```

## 9. Auto-restart on reboot
```bash
sudo systemctl enable docker
# Docker compose already has restart: unless-stopped
```
