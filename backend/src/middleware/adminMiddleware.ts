import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

export default async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        // Get user ID from auth middleware
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Access denied. No user found.' });
        }
        
        // Check if user is admin
        const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        
        if (result.rowCount === 0 || result.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};
