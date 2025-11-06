import express from 'express';
const router = express.Router();

import authRoutes from '../modules/auth/auth.routes';
import dropsRoutes from '../modules/drops/drops.routes';
import adminRoutes from '../modules/admin/admin.routes';

// Routes here
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/drops', dropsRoutes);
// router.use('/drops', userRoutes);

export default router;

