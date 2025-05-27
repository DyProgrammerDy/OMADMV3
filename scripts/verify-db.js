const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PG_BIN = 'E:\\POSTGRES17\\bin';
const PG_DATA = 'E:\\POSTGRES17\\data';
const PG_LOG = path.join(PG_DATA, 'log');

async function verifyPostgres() {
  try {
    // Ensure log directory exists
    if (!fs.existsSync(PG_LOG)) {
      fs.mkdirSync(PG_LOG, { recursive: true });
    }

    // Try to stop any existing process
    try {
      console.log('Stopping any existing PostgreSQL process...');
      execSync(`"${PG_BIN}\\pg_ctl.exe" stop -D "${PG_DATA}" -m fast`, { stdio: 'inherit' });
    } catch (error) {
      // Ignore stop errors
    }

    // Start PostgreSQL with specific options
    console.log('Starting PostgreSQL...');
    execSync(
      `"${PG_BIN}\\pg_ctl.exe" start -D "${PG_DATA}" -l "${PG_LOG}\\postgresql.log" -o "-c listen_addresses='localhost'"`, 
      { stdio: 'inherit' }
    );

    // Verify database exists
    console.log('Verifying database...');
    try {
      execSync(`"${PG_BIN}\\psql.exe" -U postgres -d OMundoDB -c "SELECT 1;"`, { stdio: 'inherit' });
    } catch (error) {
      console.log('Creating database...');
      execSync(`"${PG_BIN}\\psql.exe" -U postgres -c "CREATE DATABASE \\"OMundoDB\\";"`, { stdio: 'inherit' });
    }

    console.log('✓ PostgreSQL is running and database is ready');
    return true;
  } catch (error) {
    console.error('Database verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyPostgres().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});