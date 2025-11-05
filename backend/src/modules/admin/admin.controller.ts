import { Request, Response } from 'express';
import AdminService from './admin.service';

const getUser = async (req: Request, res: Response) => {
  try {
    const user = await AdminService.getUser(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await AdminService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    await AdminService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    await AdminService.updateUser(req.params.id, req.body);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

const getClaims = async (req: Request, res: Response) => {
  try {
    const claims = await AdminService.getClaims();
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
};

const deleteClaim = async (req: Request, res: Response) => {
  try {
    await AdminService.deleteClaim(req.params.claimId);
    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete claim' });
  }
};

const createDrop = async (req: Request, res: Response) => {
  try {
    const drop = await AdminService.createDrop(req.body);
    res.json(drop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create drop' });
  }
};

const getDrops = async (req: Request, res: Response) => {
  try {
    const drops = await AdminService.getDrops();
    res.json(drops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drops' });
  }
};

const getDrop = async (req: Request, res: Response) => {
  try {
    const drop = await AdminService.getDrop(req.params.id);
    res.json(drop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drop' });
  }
};

const updateDrop = async (req: Request, res: Response) => {
  try {
    const drop = await AdminService.updateDrop(req.params.id, req.body);
    res.json(drop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update drop' });
  }
};

const deleteDrop = async (req: Request, res: Response) => {
  try {
    await AdminService.deleteDrop(req.params.id);
    res.json({ message: 'Drop deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete drop' });
  }
};

const getDropWaitlist = async (req: Request, res: Response) => {
  try {
    const waitlist = await AdminService.getDropWaitlist(req.params.id);
    res.json(waitlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drop waitlist' });
  }
};

const createClaimWindow = async (req: Request, res: Response) => {
  try {
    const window = await AdminService.createClaimWindow(req.params.id, req.body);
    res.json(window);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create claim window' });
  }
};

const assignClaim = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.assignClaim(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign claim' });
  }
};

const getDropClaims = async (req: Request, res: Response) => {
  try {
    const claims = await AdminService.getDropClaims(req.params.id);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drop claims' });
  }
};

export { getUser, getUsers, deleteUser, updateUser, getClaims, deleteClaim, createDrop, getDrops, getDrop, updateDrop, deleteDrop, getDropWaitlist, createClaimWindow, assignClaim, getDropClaims };
