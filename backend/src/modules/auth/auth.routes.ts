import express from 'express';
import { register, login, logout, refresh, getProfile } from './auth.controller';
import authMiddleware from '../../middleware/authMiddleware';
const router = express.Router();

router.post('/signup', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, getProfile);

export default router;
