import express from 'express';
import { register, login, logout, refresh, getProfile, updateProfile, adminLogin, getUsers } from './auth.controller';
const router = express.Router();

router.post('/signup', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.post('/admin/login', adminLogin);
router.get('/admin/users', getUsers);

export default router;
