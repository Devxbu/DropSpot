import express from "express";
const router = express.Router();

import { getUsers, getUser, deleteUser, getClaims, deleteClaim, createDrop, getDrops, getDrop, updateDrop, deleteDrop, getDropWaitlist, createClaimWindow, assignClaim, getDropClaims, updateUser } from './admin.controller';
import adminMiddleware from '../../middleware/adminMiddleware';
import authMiddleware from '../../middleware/authMiddleware';

router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.get("/users/:id", authMiddleware, adminMiddleware, getUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, deleteUser);
router.put("/users/:id", authMiddleware, adminMiddleware, updateUser);

router.post("/drops", authMiddleware, adminMiddleware, createDrop);
router.get("/drops", authMiddleware, adminMiddleware, getDrops);
router.get("/drops/:id", authMiddleware, adminMiddleware, getDrop);
router.put("/drops/:id", authMiddleware, adminMiddleware, updateDrop);
router.delete("/drops/:id", authMiddleware, adminMiddleware, deleteDrop);

router.get("/drops/:id/waitlist", authMiddleware, adminMiddleware, getDropWaitlist);
router.post("/drops/:id/claim-window", authMiddleware, adminMiddleware, createClaimWindow);
router.post("/drops/:id/assign-claim", authMiddleware, adminMiddleware, assignClaim);
router.get("/drops/:id/claims", authMiddleware, adminMiddleware, getDropClaims);

router.get("/claims", authMiddleware, adminMiddleware, getClaims);
router.delete("/claims/:claimId", authMiddleware, adminMiddleware, deleteClaim);

export default router;