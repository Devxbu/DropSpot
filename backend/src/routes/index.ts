import express from 'express';
const router = express.Router();

import authRoutes from '../modules/auth/auth.routes';

// Routes here
// router.use('/admin', userRoutes);
router.use('/auth', authRoutes);
// router.use('/claim', userRoutes);
// router.use('/drops', userRoutes);

export default router;

