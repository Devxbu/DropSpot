import pool from "../../config/db";

const createUserTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        TEXT NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(100),
    role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    refresh_token   TEXT
    );
    `
    try {
        await pool.query(queryText);
        console.log('Users table created successfully');
    } catch (error) {
        console.error('Error creating users table:', error);
    }
}

export default createUserTable;