const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { isTrustedProxy } = require('./utils/client-ip');
const { securityMonitor } = require('./middlewares/security-monitor.middleware');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', (ip) => isTrustedProxy(ip));

// CORS cho tất cả origins (dev + LAN)
app.use(cors({
  origin: function (origin, callback) {
    // Cho phép mọi origin trong dev
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Helmet với config cho phép CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(securityMonitor);

// ===== ROUTES =====
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
const path = require('path');
app.use('/uploads', require('express').static(path.join(__dirname, '../uploads')));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/alerts', require('./routes/alert.routes'));
app.use('/api/logs', require('./routes/log.routes'));
app.use('/api/fields', require('./routes/field.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/threats', require('./routes/threat.routes'));
app.use('/api/assets', require('./routes/asset.routes'));
app.use('/api/investigations', require('./routes/investigation.routes'));
app.use('/api/playbooks', require('./routes/playbook.routes'));
app.use('/api/compliance', require('./routes/compliance.routes'));
app.use('/api/workflows', require('./routes/workflow.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/n8n', require('./routes/n8n.routes'));
app.use('/api/visitors', require('./routes/visitor.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/satellite', require('./routes/satellite.routes'));
app.use('/api/firewall', require('./routes/firewall.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/weather', require('./routes/weather.routes'));
app.use('/api/disease-library', require('./routes/disease.routes'));
app.use('/api/plots', require('./routes/plots.routes'));
app.use('/api/seasons', require('./routes/seasons.routes'));


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy endpoint' });
});

module.exports = app;
