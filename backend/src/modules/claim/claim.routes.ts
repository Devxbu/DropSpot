import express from "express";
const router = express.Router();

import { getClaim, createClaim, redeemClaim } from './claim.controller';
import authMiddleware from '../../middleware/authMiddleware';

router.get("/:id", authMiddleware, getClaim);
router.post("/:id/claim", authMiddleware, createClaim);
router.patch("/:id/redeem", authMiddleware, redeemClaim);

export default router;
