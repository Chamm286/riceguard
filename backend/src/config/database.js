const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu DATABASE_URL trong file .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Kết nối PostgreSQL thành công');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi PostgreSQL:', err.message);
});

module.exports = pool;
