import express from "express";
const router = express.Router();

import { getUsers, getUser, deleteUser, getClaims, deleteClaim, createDrop, getDrops, getDrop, updateDrop, deleteDrop, getDropWaitlist, createClaimWindow, assignClaim, getDropClaims, updateUser } from './admin.controller';

router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id", updateUser);

router.post("/drops", createDrop);
router.get("/drops", getDrops);
router.get("/drops/:id", getDrop);
router.put("/drops/:id", updateDrop);
router.delete("/drops/:id", deleteDrop);

router.get("/drops/:id/waitlist", getDropWaitlist);
router.post("/drops/:id/claim-window", createClaimWindow);
router.post("/drops/:id/assign-claim", assignClaim);
router.get("/drops/:id/claims", getDropClaims);

router.get("/claims", getClaims);
router.delete("/claims/:claimId", deleteClaim);


export default router;