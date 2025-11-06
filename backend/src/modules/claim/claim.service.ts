import pool from "../../config/db";
import crypto from "crypto";

export class ClaimService {
    constructor() { };
    async getClaim(id: string) {
        try {
            const claim = await pool.query('SELECT * FROM claim_codes WHERE id = $1', [id]);
            if (!claim.rows[0] || claim.rowCount === 0) {
                throw new Error('Claim not found');
            }
            return claim.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async createClaim(userId: string, dropId: string) {
        try {
            const claimWindow = await pool.query('SELECT * FROM claim_windows WHERE drop_id = $1 AND opened_at <= NOW() AND (closed_at IS NULL OR closed_at > NOW())', [dropId]);
            if (claimWindow.rowCount === 0) throw new Error('Claim window closed');

            const code = crypto.randomBytes(6).toString('hex').toUpperCase();
            const claim = await pool.query('INSERT INTO claim_codes (user_id, drop_id, code, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *', [userId, dropId, code]);
            return claim.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async redeemClaim(id: string, userId: string) {
        try {
            const claim = await pool.query('UPDATE claim_codes SET claimed = TRUE, claimed_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
            if (claim.rowCount === 0) {
                throw new Error('Claim not found or not owned by user');
            }
            return claim.rows[0];
        } catch (error) {
            throw error;
        }
    };
}

export default new ClaimService();