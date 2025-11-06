import { Request, Response } from 'express';
import ClaimService from './claim.service';

interface DropReq extends Request {
    user?: {
        userId: string;
    };
}

export const getClaim = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const claim = await ClaimService.getClaim(id);
        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch claim' });
    }
};

export const createClaim = async (req: DropReq, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { userId } = req.user;
        const { dropId } = req.body;
        const claim = await ClaimService.createClaim(userId, dropId);
        res.status(201).json(claim);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create claim' });
    }
};

export const redeemClaim = async (req: DropReq, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { userId } = req.user;
        const claim = await ClaimService.redeemClaim(id, userId);
        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: 'Failed to redeem claim' });
    }
};