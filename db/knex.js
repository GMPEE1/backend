// backend/db/knex.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // << เพิ่มบรรทัดนี้

const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '12345678',
    // password: process.env.DB_PASS || '', // สำหรับ XAMPP
    database: process.env.DB_NAME || 'hr_db',
    port: Number(process.env.DB_PORT) || 3306,
    connectTimeout: 15000,
  },
  pool: { min: 0, max: 10, acquireTimeoutMillis: 20000 },
});

// ช่วยตรวจว่าโหลดค่าถูกจริง
console.log('[DB-CONFIG]', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  db: process.env.DB_NAME,
});

module.exports = db;

