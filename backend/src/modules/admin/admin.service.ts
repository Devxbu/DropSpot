import pool from "@/config/db";
class AdminService {
    constructor() { };
    async getUser(id: string) {
        try {
            const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            return user.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async getUsers() {
        try {
            const users = await pool.query('SELECT * FROM users');
            return users.rows;
        } catch (error) {
            throw error;
        }
    };
    async deleteUser(id: string) {
        try {
            const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    };
    async updateUser(id: string, userData: any) {
        try {
            // Get infos
            const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            const username = userData.username ? userData.username : user.rows[0].username;
            const name = userData.name ? userData.name : user.rows[0].name;
            const role = userData.role ? userData.role : user.rows[0].role;

            // Update infos
            const update = await pool.query('UPDATE users SET username = $1, name = $2, role = $3 WHERE id = $4', [username, name, role, id]);
            return update.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async getClaims() {
        try {
            const claims = await pool.query('SELECT * FROM claim_codes');
            return claims.rows;
        } catch (error) {
            throw error;
        }
    };
    async deleteClaim(claimId: string) {
        try {
            const result = await pool.query('DELETE FROM claim_codes WHERE id = $1', [claimId]);
            return result;
        } catch (error) {
            throw error;
        }
    };
    async createDrop(dropData: any) {
        try {
            const drop = await pool.query('INSERT INTO drops (title, description, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *', [dropData.title, dropData.description, dropData.startTime, dropData.endTime]);
            return drop.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async getDrops() {
        try {
            const drops = await pool.query('SELECT * FROM drops');
            return drops.rows;
        } catch (error) {
            throw error;
        }
    };
    async getDrop(id: string) {
        try {
            const drop = await pool.query('SELECT * FROM drops WHERE id = $1', [id]);
            return drop.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async updateDrop(id: string, dropData: any) {
        try {
            // Get infos
            const drop = await pool.query('SELECT * FROM drops WHERE id = $1', [id]);
            const title = dropData.title || drop.rows[0].title;
            const description = dropData.description || drop.rows[0].description;
            const startTime = dropData.startTime || drop.rows[0].start_time;
            const endTime = dropData.endTime || drop.rows[0].end_time;
            
            // Update drop
            const updatedDrop = await pool.query(
                'UPDATE drops SET title = $1, description = $2, start_time = $3, end_time = $4 WHERE id = $5 RETURNING *',
                [title, description, startTime, endTime, id]
            );
            return updatedDrop.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async deleteDrop(id: string) {
        try {
            const result = await pool.query('DELETE FROM drops WHERE id = $1', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    };
    async getDropWaitlist(id: string) {
        try {
            const waitlist = await pool.query('SELECT * FROM drop_waitlist WHERE drop_id = $1', [id]);
            return waitlist.rows;
        } catch (error) {
            throw error;
        }
    };
    async createClaimWindow(dropId: string, windowData: any) {
        try {
            const window = await pool.query('INSERT INTO claim_windows (drop_id, start_time, end_time, max_claims) VALUES ($1, $2, $3, $4) RETURNING *', [dropId, windowData.startTime, windowData.endTime, windowData.maxClaims]);
            return window.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async assignClaim(windowId: string, claimData: any) {
        try {
            const claim = await pool.query('INSERT INTO claim_codes (window_id, user_id, code, assigned_at) VALUES ($1, $2, $3, $4) RETURNING *', [windowId, claimData.userId, claimData.code, new Date()]);
            return claim.rows[0];
        } catch (error) {
            throw error;
        }
    };
    async getDropClaims(dropId: string) {
        try {
            const claims = await pool.query('SELECT * FROM claim_codes WHERE drop_id = $1', [dropId]);
            return claims.rows;
        } catch (error) {
            throw error;
        }
    };
}

export default new AdminService();