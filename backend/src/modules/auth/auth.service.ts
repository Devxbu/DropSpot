import pool from "../../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

class AuthService {
    constructor() { }
    generateAccessToken(userId: string) {
        return jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
    }

    generateRefreshToken(userId: string) {
        return jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });
    }
    async register(username: string, email: string, password: string, name: string) {
        try {
            // Check if user exists
            const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (user.rows.length > 0) {
                throw new Error('User already exists');
            }

            // Hashing Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Save user to database
            const newUser = await pool.query("INSERT INTO users (username, email, password, name) VALUES ($1, $2, $3, $4) RETURNING *", [username, email, hashedPassword, name]);
            const userId = newUser.rows[0].id;

            // Create tokens
            const accessToken = this.generateAccessToken(userId);
            const refreshToken = this.generateRefreshToken(userId);

            // Saving tokens to database
            pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, userId]);
            return { accessToken, refreshToken };
        } catch (error) {
            throw error;
        }
    }
    async login(email: string, password: string) {
        try {
            // Check user is created
            const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (user.rows.length === 0) {
                throw new Error('Invalid credentials');
            }

            // Compare Passwords
            const validPassword = await bcrypt.compare(password, user.rows[0].password);
            if (!validPassword) {
                throw new Error('Invalid credentials');
            }

            // Create Tokens
            const accessToken = this.generateAccessToken(user.rows[0].id);
            const refreshToken = this.generateRefreshToken(user.rows[0].id);

            // Save refresh token to database
            pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.rows[0].id]);
            return { accessToken, refreshToken };
        } catch (error) {
            throw error;
        }
    }
    async logout(refreshToken: string) {
        try {
            // Get the user with refresh token
            const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as { userId: String };
            const user = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);

            // Check if the refresh token matches the one stored in the database
            if (user.rows.length == 0 || !user || user.rows[0].refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Remove refresh token from database
            pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [decoded.userId]);
            return { message: 'Logout successful' };
        } catch (error) {
            throw error;
        }
    }
    async refresh(refreshToken: string) {
        try {
            // Get the user with refresh token
            const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as { userId: String };
            const user = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);

            // Check if the refresh token matches the one stored in the database
            if (user.rows.length == 0 || !user || user.rows[0].refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Generate new access token
            const accessToken = this.generateAccessToken(user.rows[0].id);
            return { accessToken };
        } catch (error) {
            throw error;
        }
    }
    async getProfile(userId: string) {
        try {
            // Get user
            const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
            return user.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

export default new AuthService();
