// db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const DB = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'checklist',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3308,
  waitForConnections: true,
  connectionLimit: 10,
});
