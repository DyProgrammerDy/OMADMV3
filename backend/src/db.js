const { Pool } = require('pg');

// It's good practice to load these from environment variables
const PGUSER = process.env.PGUSER || 'postgres'; // Default user
const PGHOST = process.env.PGHOST || 'localhost';
const PGDATABASE = process.env.PGDATABASE || 'OMundoDB'; // Your PostgreSQL database name
const PGPASSWORD = process.env.PGPASSWORD || 'sENHAS'; // Replace with your actual password or use env var
const PGPORT = process.env.PGPORT || 5432;

let pool = null;

async function connectDB() {
  if (pool) {
    // console.log('PostgreSQL pool already initialized.');
    return pool;
  }
  try {
    pool = new Pool({
      user: PGUSER,
      host: PGHOST,
      database: PGDATABASE,
      password: PGPASSWORD,
      port: PGPORT,
    });
    // Test the connection
    await pool.query('SELECT NOW()');
    console.log(`✓ PostgreSQL pool connected successfully to ${PGDATABASE}`);
    return pool;
  } catch (err) {
    console.error('✗ Failed to connect to PostgreSQL database:', err.message);
    pool = null; // Ensure pool is null if connection fails
    throw err; // Rethrow to be caught by the main startup logic
  }
}

function getDB() {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Ensure connectDB() was called and awaited successfully at application startup.');
  }
  return pool; // For pg, we usually return the pool directly for querying
}

async function closeDB() {
  if (pool) {
    await pool.end();
    console.log('PostgreSQL pool has been closed.');
    pool = null;
  }
}

async function testConnection() {
  try {
    const currentPool = getDB(); // Ensures connectDB has been called
    await currentPool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('✗ PostgreSQL connection test failed:', err.message);
    return false;
  }
}

module.exports = { connectDB, getDB, closeDB, testConnection };