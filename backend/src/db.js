const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'OMundoDB',
    password: 'sENHAS',
    port: 5432,
    connectionTimeoutMillis: 5000
});

const testConnection = async () => {
    try {
        console.log('Testing database connection...');
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✓ Database connected at:', result.rows[0].now);
        client.release();
        return true;
    } catch (err) {
        console.error('Database connection error:', {
            message: err.message,
            code: err.code,
            database: pool.options.database
        });
        return false;
    }
};

module.exports = { pool, testConnection };
