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
        try {
            // Check if the user is already on the waitlist to prevent duplicates
            const exists = await pool.query('SELECT * FROM waitlist WHERE drop_id = $1 AND user_id = $2', [id, userId]);
            if (exists.rows.length > 0) {
                throw new Error("User already joined the waitlist for this drop");
            }

            const waitlist = await pool.query('INSERT INTO waitlist (drop_id, user_id) VALUES ($1, $2) RETURNING *', [id, userId]);
            return waitlist.rows[0];
        } catch (error) {
            throw error;
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
        try {
            // Check if claim window is open
            const claimWindow = await pool.query('SELECT * FROM claim_windows WHERE drop_id = $1 AND start_time <= NOW() AND end_time > NOW()', [id]);
            if (claimWindow.rows.length === 0) {
                throw new Error("Claim window is not open for this drop");
            }

            // Check if user is on waitlist
            const waitlist = await pool.query('SELECT * FROM waitlist WHERE drop_id = $1 AND user_id = $2', [id, userId]);
            if (waitlist.rows.length === 0) {
                throw new Error("You are not on the waitlist for this drop");
            }

            // Check if user already claimed
            const existingClaim = await pool.query('SELECT * FROM claims WHERE drop_id = $1 AND user_id = $2', [id, userId]);
            if (existingClaim.rows.length > 0) {
                throw new Error("You already claimed this drop");
            }

            // If user is eligible, create claim
            const claimCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const newClaim = await pool.query('INSERT INTO claims (user_id, drop_id, claim_code, claimed_at) VALUES ($1, $2, $3, NOW()) RETURNING *', [userId, id, claimCode]);
            return newClaim.rows[0].claim_code;
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
