import { Pool } from 'pg';
import DropService from './drops.service';

// Mock the pg pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

describe('DropService', () => {
  let pool: jest.Mocked<Pool>;
  const mockDrop = {
    id: '1',
    title: 'Test Drop',
    description: 'Test Description',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  };
  const mockWaitlist = {
    id: 'wait1',
    drop_id: '1',
    user_id: 'user1',
    joined_at: new Date().toISOString()
  };
  const mockClaim = {
    id: 'claim1',
    user_id: 'user1',
    drop_id: '1',
    claim_code: 'ABC123',
    claimed_at: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pool = require('../../config/db') as jest.Mocked<Pool>;
  });

  describe('getDrops', () => {
    it('should return all drops', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDrop], rowCount: 1 });
      
      const result = await DropService.getDrops();
      
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM drops ORDER BY created_at DESC');
      expect(result).toEqual([mockDrop]);
    });

    it('should throw an error when no drops found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(DropService.getDrops()).rejects.toThrow('No drops found');
    });
  });

  describe('getDrop', () => {
    it('should return a drop by id', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDrop], rowCount: 1 });
      
      const result = await DropService.getDrop('1');
      
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM drops WHERE id = $1', ['1']);
      expect(result).toEqual(mockDrop);
    });

    it('should throw an error when drop not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(DropService.getDrop('999')).rejects.toThrow('Drop not found');
    });
  });

  describe('addWaitlist', () => {
    it('should add user to waitlist', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // First call for checking existing waitlist
        .mockResolvedValueOnce({ rows: [mockWaitlist], rowCount: 1 }); // Insert call
      
      const result = await DropService.addWaitlist('1', 'user1');
      
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM waitlist WHERE drop_id = $1 AND user_id = $2',
        ['1', 'user1']
      );
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO waitlist (drop_id, user_id) VALUES ($1, $2) RETURNING *',
        ['1', 'user1']
      );
      expect(result).toEqual(mockWaitlist);
    });

    it('should throw an error if user is already on waitlist', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockWaitlist], rowCount: 1 });
      
      await expect(DropService.addWaitlist('1', 'user1'))
        .rejects
        .toThrow('User already joined the waitlist for this drop');
    });
  });

  describe('removeWaitlist', () => {
    it('should remove user from waitlist', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockWaitlist], rowCount: 1 });
      
      const result = await DropService.removeWaitlist('1', 'user1');
      
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM waitlist WHERE drop_id = $1 AND user_id = $2 RETURNING *',
        ['1', 'user1']
      );
      expect(result).toEqual(mockWaitlist);
    });

    it('should throw an error if user is not on waitlist', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(DropService.removeWaitlist('1', 'user1'))
        .rejects
        .toThrow('User was not on the waitlist or already removed');
    });
  });

  describe('claimDrop', () => {
    const mockClaimWindow = {
      id: 'window1',
      drop_id: '1',
      start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      end_time: new Date(Date.now() + 3600000).toISOString(),  // 1 hour from now
      max_claims: 100
    };

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
      
      // Setup default mock responses
      // Cast mock responses to proper type
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockClaimWindow], rowCount: 1 }) // getClaimWindow
        .mockResolvedValueOnce({ rows: [mockWaitlist], rowCount: 1 })    // checkWaitlist
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })                // checkExistingClaim
        .mockResolvedValueOnce({ rows: [mockClaim], rowCount: 1 });      // createClaim
    });

    it('should create a claim when all conditions are met', async () => {
      const claimCode = await DropService.claimDrop('1', 'user1');
      
      // Verify claim window check
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM claim_windows WHERE drop_id = $1 AND start_time <= NOW() AND end_time > NOW()',
        ['1']
      );
      
      // Verify waitlist check
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM waitlist WHERE drop_id = $1 AND user_id = $2',
        ['1', 'user1']
      );
      
      // Verify existing claim check
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM claims WHERE drop_id = $1 AND user_id = $2',
        ['1', 'user1']
      );
      
      // Verify claim creation
      expect(claimCode).toBe(mockClaim.claim_code);
    });

    it('should throw error when claim window is not open', async () => {
      (pool.query as jest.Mock).mockReset();
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 }); // No open claim window
      
      await expect(DropService.claimDrop('1', 'user1'))
        .rejects
        .toThrow('Claim window is not open for this drop');
    });

    it('should throw error when user is not on waitlist', async () => {
      (pool.query as jest.Mock).mockReset();
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockClaimWindow], rowCount: 1 }) // getClaimWindow
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });              // checkWaitlist (empty)
      
      await expect(DropService.claimDrop('1', 'user1'))
        .rejects
        .toThrow('You are not on the waitlist for this drop');
    });

    it('should throw error when user already claimed', async () => {
      (pool.query as jest.Mock).mockReset();
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockClaimWindow], rowCount: 1 }) // getClaimWindow
        .mockResolvedValueOnce({ rows: [mockWaitlist], rowCount: 1 })    // checkWaitlist
        .mockResolvedValueOnce({ rows: [mockClaim], rowCount: 1 });      // existing claim
      
      await expect(DropService.claimDrop('1', 'user1'))
        .rejects
        .toThrow('You already claimed this drop');
    });
  });

  describe('getMyDrops', () => {
    it('should return user\'s drops from waitlist', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDrop], rowCount: 1 });
      
      const result = await DropService.getMyDrops('user1');
      
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT d.* FROM drops d INNER JOIN waitlist w ON d.id = w.drop_id WHERE w.user_id = $1 ORDER BY d.created_at DESC`,
        ['user1']
      );
      expect(result).toEqual([mockDrop]);
    });

    it('should return empty array when no drops found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      const result = await DropService.getMyDrops('user1');
      
      expect(result).toEqual([]);
    });
  });
});