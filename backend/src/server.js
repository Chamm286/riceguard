const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./config/database');
const { startLogReader } = require('./services/logReader');
const { startAlertPoller } = require('./services/alertPoller');

const PORT = process.env.PORT || 5000;

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY, ip VARCHAR(45) UNIQUE NOT NULL,
    reason TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS ip VARCHAR(45)`);
  await pool.query(`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
  await pool.query(`CREATE TABLE IF NOT EXISTS workflow_logs (
    id SERIAL PRIMARY KEY, workflow_id VARCHAR(100), status VARCHAR(20),
    execution_count INT, message TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow_id ON workflow_logs (workflow_id)`);
}

ensureTables().catch(console.error);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, path: '/socket.io' });
app.set('io', io);
global.io = io;

io.on('connection', (socket) => {
  socket.join('alerts');
});

global.emitNewAlert = (alert) => {
  io.to('alerts').emit('new_alert', alert);
};

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server chạy tại http://0.0.0.0:${PORT}`);
  startAlertPoller();
  startLogReader();
});
