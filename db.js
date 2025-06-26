// Database connection
import mysql from 'mysql2/promise';

export const DB = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'checklist',
  port: 3308,
  waitForConnections: true,
  connectionLimit: 10
});