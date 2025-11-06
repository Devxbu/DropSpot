import pool from "../../config/db";

class DropService {
    constructor() { };
    async getDrops() {
        try {
            // Fetch all active drops ordered by creation time (optional improvement)
            const drops = await pool.query('SELECT * FROM drops ORDER BY created_at DESC');
            if (drops.rows.length === 0 || drops.rowCount === 0) {
                throw new Error("No drops found");
            }
            return drops.rows;
        } catch (error) {
            throw error;
        }
    }

    async getDrop(id: string) {
        try {
            const drop = await pool.query('SELECT * FROM drops WHERE id = $1', [id]);
            // Always check if the drop exists before returning
            if (drop.rows.length === 0) {
                throw new Error("Drop not found");
            }
            return drop.rows[0];
        } catch (error) {
            throw error;
        }
    }

    async addWaitlist(id: string, userId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Set transaction isolation level to SERIALIZABLE for this operation
            await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

            // Check if drop exists and is active
            const drop = await client.query(
                'SELECT * FROM drops WHERE id = $1 AND start_time <= NOW() AND end_time > NOW() FOR UPDATE',
                [id]
            );
            
            if (drop.rows.length === 0) {
                throw new Error("Drop not found or not active");
            }

            // Check if the user is already on the waitlist to prevent duplicates
            const exists = await client.query(
                'SELECT id FROM waitlist WHERE drop_id = $1 AND user_id = $2 FOR UPDATE', 
                [id, userId]
            );
            
            if (exists.rows.length > 0) {
                throw new Error("User already joined the waitlist for this drop");
            }

            // Get user's account creation time in a single query
            const userResult = await client.query(
                `SELECT created_at, 
                (SELECT COUNT(*) FROM waitlist 
                 WHERE user_id = $1 
                 AND joined_at > NOW() - INTERVAL '1 hour') as recent_joins
                FROM users WHERE id = $1 FOR UPDATE`,
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                throw new Error("User not found");
            }
            
            const userCreatedAt = new Date(userResult.rows[0].created_at);
            const now = new Date();
            
            // Calculate metrics for priority score
            const accountAgeDays = Math.max(0, Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
            const signupLatencyMs = Math.max(0, now.getTime() - userCreatedAt.getTime());
            const rapidActions = parseInt(userResult.rows[0].recent_joins, 10) + 1; // +1 for current join

            // Insert into waitlist with calculated priority score
            const waitlist = await client.query(
                `INSERT INTO waitlist 
                (drop_id, user_id, signup_latency_ms, account_age_days, rapid_actions) 
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`, 
                [id, userId, signupLatencyMs, accountAgeDays, rapidActions]
            );

            await client.query('COMMIT');
            return waitlist.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async removeWaitlist(id: string, userId: string) {
        try {
            // Use RETURNING to confirm if any record was deleted
            const result = await pool.query('DELETE FROM waitlist WHERE drop_id = $1 AND user_id = $2 RETURNING *', [id, userId]);
            if (result.rows.length === 0) {
                throw new Error("User was not on the waitlist or already removed");
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
    async claimDrop(id: string, userId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

            // Check if claim window is open and lock the row
            const claimWindow = await client.query(
                `SELECT * FROM claim_windows 
                 WHERE drop_id = $1 
                 AND (closed_at IS NULL OR closed_at > NOW())
                 AND opened_at <= NOW()
                 FOR UPDATE`,
                [id]
            );
            
            if (claimWindow.rows.length === 0) {
                throw new Error("Claim window is not open for this drop");
            }

            // Get the user's position in the waitlist with row-level lock
            const userInWaitlist = await client.query(
                `SELECT w.id as waitlist_id, w.priority_score, w.joined_at
                FROM waitlist w
                WHERE w.drop_id = $1 AND w.user_id = $2
                FOR UPDATE`,
                [id, userId]
            );

            if (userInWaitlist.rows.length === 0) {
                throw new Error("You are not in the waitlist for this drop");
            }

            // Check if user is at the top of the waitlist
            const topUser = await client.query(
                `SELECT user_id, priority_score, joined_at
                FROM waitlist 
                WHERE drop_id = $1 
                ORDER BY priority_score DESC, joined_at ASC 
                LIMIT 1 FOR UPDATE`,
                [id]
            );

            if (topUser.rows.length === 0) {
                throw new Error("No users in the waitlist for this drop");
            }

            const currentUser = userInWaitlist.rows[0];
            const topUserData = topUser.rows[0];

            // Verify the current user is the one with the highest priority
            if (currentUser.priority_score !== topUserData.priority_score || 
                currentUser.joined_at > topUserData.joined_at) {
                throw new Error("It's not your turn to claim this drop");
            }

            // Generate a unique claim code
            const claimCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            
            // Create claim code and remove from waitlist in a single transaction
            const newClaim = await client.query(
                `WITH deleted_waitlist AS (
                    DELETE FROM waitlist 
                    WHERE id = $1 AND user_id = $2 AND drop_id = $3
                    RETURNING *
                )
                INSERT INTO claim_codes 
                (user_id, drop_id, waitlist_id, code, claimed, claimed_at)
                SELECT $2, $3, $1, $4, true, NOW()
                FROM deleted_waitlist
                RETURNING *`,
                [currentUser.waitlist_id, userId, id, claimCode]
            );

            if (newClaim.rows.length === 0) {
                throw new Error("Failed to process claim");
            }

            await client.query('COMMIT');
            return { claimCode, claimedAt: newClaim.rows[0].claimed_at };
        } catch (error) {
            console.error(error);
            throw error;
        }

    };
    async getMyDrops(userId: string) {
        try {
            // Use a JOIN to improve performance instead of multiple queries
            const result = await pool.query(`SELECT d.* FROM drops d INNER JOIN waitlist w ON d.id = w.drop_id WHERE w.user_id = $1 ORDER BY d.created_at DESC`, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    };
}

export default new DropService();
