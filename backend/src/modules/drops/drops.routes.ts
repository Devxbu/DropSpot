import express from "express";
const router = express.Router();

import { getDrops, getDrop, addWaitlist, removeWaitlist, claimDrop, getMyDrops } from "./drops.controller";
import authMiddleware from "../../middleware/authMiddleware";

router.get("/", authMiddleware, getDrops);
router.get("/:id", authMiddleware, getDrop);
router.post("/:id/waitlist", authMiddleware, addWaitlist);
router.delete("/:id/waitlist", authMiddleware, removeWaitlist);
router.post("/:id/claim", authMiddleware, claimDrop);
router.get("/my", authMiddleware, getMyDrops);

export default router;