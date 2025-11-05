import pool from "../../config/db";

const createDropsTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );
    `
    try {
        await pool.query(queryText);
        console.log('Drops table created successfully');
    } catch (error) {
        console.error('Error creating drops table:', error);
    }
}

const createWaitlistTable = async () => {
    const queryText = `
    CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, drop_id)
    );
    `
    try {
        await pool.query(queryText);
        console.log('Waitlist table created successfully');
    } catch (error) {
        console.error('Error creating waitlist table:', error);
    }
}

export default {createDropsTable, createWaitlistTable};
