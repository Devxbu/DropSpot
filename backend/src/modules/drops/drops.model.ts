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
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT drops_time_check CHECK (end_time > start_time)
    );
    
    CREATE INDEX IF NOT EXISTS idx_drops_created_at ON drops(created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_drops_title_unique ON drops(LOWER(title));
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
    CREATE TABLE IF NOT EXISTS waitlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        priority_score INT NOT NULL DEFAULT 0,
        signup_latency_ms INT NOT NULL DEFAULT 0,
        account_age_days INT NOT NULL DEFAULT 0,
        rapid_actions INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, drop_id),
        CONSTRAINT positive_priority CHECK (priority_score >= 0)
    );
    
    CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(drop_id, priority_score DESC);
    CREATE INDEX IF NOT EXISTS idx_waitlist_user ON waitlist(user_id);
    `
    try {
        await pool.query(queryText);
        console.log('Waitlist table created successfully');
    } catch (error) {
        console.error('Error creating waitlist table:', error);
    }
}

// Migration function to add new columns if they don't exist
const migrateWaitlistTable = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if the waitlist table exists
        const tableExists = await client.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'waitlist'
            )`
        );

        if (!tableExists.rows[0].exists) {
            console.log('Waitlist table does not exist yet, skipping migration');
            await client.query('COMMIT');
            return;
        }

        const migrationQueries = [
            `ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS priority_score INT NOT NULL DEFAULT 0`,
            `ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS signup_latency_ms INT NOT NULL DEFAULT 0`,
            `ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS account_age_days INT NOT NULL DEFAULT 0`,
            `ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS rapid_actions INT NOT NULL DEFAULT 0`,
            `CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(drop_id, priority_score DESC)`
        ];

        for (const query of migrationQueries) {
            try {
                await client.query(query);
            } catch (error) {
                console.warn(`Warning executing migration query: ${query}`, error);
                // Continue with the next query even if one fails
            }
        }
        
        await client.query('COMMIT');
        console.log('Waitlist table migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during waitlist table migration:', error);
        throw error;
    } finally {
        client.release();
    }
};

export { createDropsTable, createWaitlistTable, migrateWaitlistTable };
