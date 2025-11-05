import { Request, Response } from "express";
import DropService from "./drops.service";

interface DropReq extends Request {
    user?: {
        userId: string;
    };
}

const getDrops = async (req: Request, res: Response) => {
    try {
        const drops = await DropService.getDrops();
        res.json(drops);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch drops' });
    }
}

const getDrop = async (req: Request, res: Response) => {
    try {
        const drop = await DropService.getDrop(req.params.id);
        res.json(drop);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch drop' });
    }
}

const addWaitlist = async (req: DropReq, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { userId } = req.user
        const drop = await DropService.addWaitlist(req.params.id, userId);
        res.json(drop);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to waitlist' });
    }
}

const removeWaitlist = async (req: DropReq, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { userId } = req.user
        const drop = await DropService.removeWaitlist(req.params.id, userId);
        res.json(drop);
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove from waitlist' });
    }
}

const claimDrop = async (req: DropReq, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { userId } = req.user;
        const drop = await DropService.claimDrop(req.params.id, userId);
        res.json(drop);
    } catch (error) {
        res.status(500).json({ error: 'Failed to claim drop' });
    }
}

const getMyDrops = async (req: DropReq, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { userId } = req.user
        const drops = await DropService.getMyDrops(userId);
        res.json(drops);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch my drops' });
    }
}



export { getDrops, getDrop, addWaitlist, removeWaitlist, claimDrop, getMyDrops };
