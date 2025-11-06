import pool from "../../config/db";

const createClaimTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS claim_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
        waitlist_id UUID NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,
        code VARCHAR(100) NOT NULL,
        claimed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        claimed_at TIMESTAMP,
        UNIQUE (user_id, drop_id),
        UNIQUE (code)
    );
    
    CREATE INDEX IF NOT EXISTS idx_claim_codes_user ON claim_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_claim_codes_drop ON claim_codes(drop_id);
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
        drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
        opened_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMP,
        CONSTRAINT valid_window_times CHECK (closed_at IS NULL OR closed_at > opened_at)
    );
    
    CREATE INDEX IF NOT EXISTS idx_claim_windows_drop ON claim_windows(drop_id);
    `
    try {
        await pool.query(queryText);
        console.log('Claim windows table created successfully');
    } catch (error) {
        console.error('Error creating claim windows table:', error);
    }
}

export { createClaimTable, createClaimWindowTable };
