import { Request, Response } from 'express';
import AuthService from './auth.service';

const register = async (req: Request, res: Response) => {
    try {
        const { email, password, username, name } = req.body;
        const user = await AuthService.register(username, email, password, name);
        res.json({ message: 'User registered successfully', user });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken } = await AuthService.login(email, password);
        res.json({ accessToken, refreshToken });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        await AuthService.logout(refreshToken);
        res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        const { accessToken } = await AuthService.refresh(refreshToken);
        res.json({ accessToken });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { userId } = req.user;
        const user = await AuthService.getProfile(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export { register, login, logout, refresh, getProfile };