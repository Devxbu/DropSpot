import pool from "../../config/db";

const createClaimTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS claim_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    claimed_at TIMESTAMP
    );
    `
    try {
        await pool.query(queryText);
        console.log('Claim codes table created successfully');
    } catch (error) {
        console.error('Error creating claim codes table:', error);
    }
}

const createClaimWindowTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS claim_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
    opened_by UUID REFERENCES users(id),
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
    );
    `
    try {
        await pool.query(queryText);
        console.log('Claim windows table created successfully');
    } catch (error) {
        console.error('Error creating claim windows table:', error);
    }
}

export { createClaimTable, createClaimWindowTable };
