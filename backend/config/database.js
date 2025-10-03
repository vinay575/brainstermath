const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create connection pool with TiDB Cloud configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(path.resolve(__dirname, '..', process.env.DB_CA_PATH)),
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to TiDB Cloud');
    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to TiDB Cloud:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
