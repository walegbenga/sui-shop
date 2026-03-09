/**
 * Database Configuration and Pool
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { Pool } from 'pg';

console.log('📊 Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

// PostgreSQL connection pool
export const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'suishop',
  user: 'suishop',
  password: 'suishop_password_2026',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err.message);
  });

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

// Helper function
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
}

export default pool;