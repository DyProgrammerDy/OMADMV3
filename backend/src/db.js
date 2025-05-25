const { Pool } = require('pg');

// TODO: Configure these credentials via environment variables in a production environment.
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'omundoasuaporta_db',
  password: 'your_password',
  port: 5432,
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Error executing query', err.stack);
    throw err;
  }
};

module.exports = {
  query,
};
