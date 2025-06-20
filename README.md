# ModularOMundoADM2025
Versão modular do sistema

## Getting Started

### Database Setup

The application uses a PostgreSQL database. The connection details configured by default in `backend/src/db.js` are:
- **Database Name:** `omundoasuaporta_db`
- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres`
- **Password:** (See `backend/src/db.js` - default is 'your_password')

You will need to manually create the database `omundoasuaporta_db` in your PostgreSQL instance before starting the backend. For example, using `psql`:
```sql
CREATE DATABASE omundoasuaporta_db;
```

**Table Creation:**
Execute the following SQL commands to set up the required tables:

```sql
-- Create dashboard_modules table
CREATE TABLE dashboard_modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    description TEXT,
    icon_name VARCHAR(100),
    module_key VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Important Security Note:**
The default password in `backend/src/db.js` is a placeholder (`'your_password'`). For any environment, especially production, ensure you change this password to a strong, unique password. It is highly recommended to configure database credentials using environment variables as commented in `backend/src/db.js` (e.g., `PGUSER`, `PGHOST`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`).

### Backend

To start the backend server, follow these steps:

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```npm install 
3. Start the server:
   ```bash
   npm start
   ```
The backend server will typically be running on port 3001 or as specified in the application.

### Frontend

To start the frontend development server, follow these steps:

1. Navigate to the `o-mundo-a-sua-porta-frontend` directory:
   ```bash
   cd o-mundo-a-sua-porta-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
This will typically open the application in your default web browser at [http://localhost:3000](http://localhost:3000).
