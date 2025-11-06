import { Pool } from 'pg';

// Use test database URL for testing environment
const connectionString = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dropspot_test'
  : process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dropspot';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
  }
});

export default pool;
