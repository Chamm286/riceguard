# RiceGuard API Endpoints Inventory

Base URL: `http://localhost:5000/api` (production: behind ngrok)

## Authentication
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| POST | /api/auth/login | Đăng nhập, trả JWT token | Public |
| GET | /api/auth/me | Thông tin user hiện tại | Auth |
| PUT | /api/auth/me | Cập nhật profile | Auth |
| PUT | /api/auth/password | Đổi mật khẩu | Auth |

## Dashboard
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/dashboard/stats | Thống kê tổng quan (alerts, logs, fields) | admin/analyst |
| GET | /api/dashboard/alerts-timeline | Biểu đồ cảnh báo 7 ngày | admin/analyst |
| GET | /api/dashboard/alerts-by-severity | Phân loại theo mức độ | admin/analyst |
| GET | /api/dashboard/alerts-by-category | Phân loại theo category | admin/analyst |
| GET | /api/dashboard/recent-alerts | 10 cảnh báo mới nhất | admin/analyst |
| GET | /api/dashboard/ai-summary | AI summary từ n8n (A9) | admin/analyst |

## Alerts
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/alerts/mine | Cảnh báo của user hiện tại | Auth |
| POST | /api/alerts | Tạo cảnh báo mới | admin/analyst |
| GET | /api/alerts | Danh sách cảnh báo | admin/analyst |
| GET | /api/alerts/:id | Chi tiết cảnh báo | admin/analyst |
| PUT | /api/alerts/:id/status | Cập nhật trạng thái | admin/analyst |
| PUT | /api/alerts/:id/assign | Gán người xử lý | admin/analyst |
| POST | /api/alerts/:id/block-ip | Chặn IP | admin/analyst |
| POST | /api/alerts/:id/notify | Gửi thông báo | admin/analyst |
| GET | /api/alerts/count | Số lượng cảnh báo | Auth |

## Threats
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/threats | Danh sách mối đe dọa | admin/analyst |
| GET | /api/threats/stats | Thống kê threats | admin/analyst |
| POST | /api/threats/:id/block | Chặn threat | admin/analyst |
| POST | /api/threats/:id/watch | Theo dõi threat | admin/analyst |

## Logs
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/logs | Danh sách log | admin/analyst |
| GET | /api/logs/stats | Thống kê log | admin/analyst |

## Assets
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/assets | Danh sách tài sản | admin/analyst |
| GET | /api/assets/stats | Thống kê tài sản | admin/analyst |
| GET | /api/assets/:id | Chi tiết tài sản | admin/analyst |

## Visitors
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| POST | /api/visitors/track | Ghi nhận visitor | Public (middleware) |
| GET | /api/visitors | Danh sách visitors | Auth |
| GET | /api/visitors/stats | Thống kê visitors + alerts | Auth |
| GET | /api/visitors/map | Dữ liệu bản đồ GeoIP | Auth |
| GET | /api/visitors/suspicious | Visitors đáng ngờ | Auth |
| GET | /api/visitors/alerts | Cảnh báo theo IP | Auth |
| POST | /api/visitors/geocode-missing | Geocode IP thiếu tọa độ | Auth |

## Workflows (n8n)
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/workflows | Danh sách workflow | admin/analyst |
| GET | /api/workflows/stats | Thống kê workflow | admin/analyst |
| POST | /api/workflows/sync | Đồng bộ từ n8n | admin |
| POST | /api/workflows/:id/toggle | Bật/tắt workflow | admin/analyst |
| POST | /api/workflows/:id/run | Chạy thử workflow | admin/analyst |
| GET | /api/workflows/:id/logs | Lịch sử chạy | admin/analyst |

## Stats
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/stats/sidebar | Badge counts cho sidebar | Auth |

## System
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/system/status | Trạng thái hệ thống | admin/analyst |
| GET | /api/system/activity | Hoạt động hệ thống | admin/analyst |

## Fields / Plots / Seasons / Weather / Reports
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/fields | Danh sách vùng canh tác | Auth |
| GET | /api/fields/:id | Chi tiết field | Auth |
| GET | /api/plots | Danh sách plots | Auth |
| GET | /api/seasons | Danh sách mùa vụ | Auth |
| GET | /api/weather | Thời tiết | Auth |
| POST | /api/reports | Tạo báo cáo lúa (upload ảnh) | Auth |
| GET | /api/reports | Danh sách báo cáo | Auth |
| GET | /api/reports/:id | Chi tiết báo cáo | Auth |
| PUT | /api/reports/:id/status | Cập nhật trạng thái | admin/analyst |

## Satellite
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/satellite/summary | Tóm tắt satellite | Auth |
| POST | /api/satellite/analyze | Phân tích vệ tinh (trigger n8n) | Auth |

## Investigations
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/investigations | Danh sách điều tra | admin/analyst |
| GET | /api/investigations/stats | Thống kê điều tra | admin/analyst |
| PUT | /api/investigations/:id/progress | Cập nhật tiến độ | admin/analyst |

## Users (Admin)
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/users | Danh sách users | admin |
| PUT | /api/users/:id/status | Cập nhật trạng thái user | admin |

## Audit
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/audit | Audit log | admin/analyst |

## Notifications
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/notifications/mine | Thông báo của user | Auth |
| GET | /api/notifications/count | Số thông báo chưa đọc | Auth |
| PUT | /api/notifications/:id/read | Đánh dấu đã đọc | Auth |
| PUT | /api/notifications/read-all | Đánh dấu tất cả đã đọc | Auth |

## Compliance
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/compliance | Checklist tuân thủ | admin/analyst |
| GET | /api/compliance/stats | Thống kê tuân thủ | admin/analyst |
| GET | /api/compliance/by-framework | Theo framework | admin/analyst |

## Playbooks
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/playbooks | Danh sách playbooks | admin/analyst |
| GET | /api/playbooks/stats | Thống kê playbooks | admin/analyst |
| POST | /api/playbooks/:id/run | Chạy playbook | admin/analyst |

## Firewall
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/firewall/blocked | Danh sách IP bị chặn | admin/analyst |
| POST | /api/firewall/block | Chặn IP | admin/analyst |
| DELETE | /api/firewall/unblock/:ip | Mở chặn IP | admin/analyst |

## Settings
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/settings/security | Cài đặt bảo mật | admin/analyst |
| PUT | /api/settings/security | Cập nhật cài đặt bảo mật | admin/analyst |

## n8n Callbacks (internal)
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| POST | /api/n8n/alert | n8n cập nhật alert | Internal |
| POST | /api/n8n/block-ip | n8n chặn IP | Internal |
| POST | /api/n8n/log | n8n ghi log | Internal |

## Health
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/health | Health check | Public |

## n8n Webhooks (direct)
| Method | URL | Chức năng |
|--------|-----|-----------|
| POST | /webhook/security-event | SOC Alert Triage trigger |
| POST | /webhook/new-report | Rice Disease Diagnosis trigger |
| POST | /webhook/sentinel-analyze | Sentinel-2 Sync trigger |
| POST | /webhook/daily-report | Daily Security Report trigger |

**Tổng cộng: ~80+ endpoints**


## Analytics
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| GET | /api/analytics/attacks-by-country | Thống kê tấn công theo quốc gia | admin/analyst |
| GET | /api/analytics/top-attackers | Top IP tấn công nhiều nhất | admin/analyst |
| GET | /api/analytics/attacks-by-type | Thống kê theo loại tấn công | admin/analyst |
| GET | /api/analytics/attacks-timeline-hourly | Timeline tấn công theo giờ (24h) | admin/analyst |
| GET | /api/analytics/ndvi-history | Lịch sử NDVI từ vệ tinh | Auth |
| GET | /api/analytics/risk-score | Điểm rủi ro hệ thống | admin/analyst |
| GET | /api/analytics/summary | Tóm tắt tổng quan | Auth |

## AI
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| POST | /api/ai/chat | Chat với AI assistant | Auth |
| GET | /api/ai/suggestions | Gợi ý hành động từ AI | Auth |

## User Management (mở rộng)
| Method | URL | Chức năng | Role |
|--------|-----|-----------|------|
| POST | /api/users/register | Đăng ký user mới | Public |
| GET | /api/users/:id | Chi tiết user | admin |
| DELETE | /api/users/:id | Xóa user | admin |
| PUT | /api/users/:id/role | Phân quyền user | admin |

## Ghi chú
Tất cả các resource (Alerts, Threats, Assets, Investigations, Logs, Fields, Playbooks, Compliance, Notifications, Visitors) đều hỗ trợ đầy đủ CRUD: GET (list), GET /:id (chi tiết), POST (tạo), PUT /:id (cập nhật), DELETE /:id (xóa).
