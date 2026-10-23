const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./config/database');

const PORT = process.env.PORT || 5000;

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY, ip_address VARCHAR(45) UNIQUE NOT NULL,
    reason TEXT, blocked_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS workflow_logs (
    id SERIAL PRIMARY KEY, workflow_id VARCHAR(100), status VARCHAR(20),
    execution_count INT, message TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`);
}
ensureTables().catch(console.error);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, path: '/socket.io' });
app.set('io', io);
global.io = io;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server chạy tại http://0.0.0.0:${PORT}`);
});
