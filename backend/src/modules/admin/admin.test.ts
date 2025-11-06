import { Pool } from 'pg';
import AdminService from './admin.service';

// Mock the pg pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

describe('AdminService', () => {
  let pool: jest.Mocked<Pool>;

  // Mock data
  const mockUser = {
    id: '1',
    username: 'testuser',
    name: 'Test User',
    role: 'user',
    email: 'test@example.com'
  };

  const mockDrop = {
    id: '1',
    title: 'Test Drop',
    description: 'Test Description',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  };

  const mockClaim = {
    id: 'claim1',
    window_id: 'window1',
    drop_id: 'drop1',
    user_id: 'user1',
    code: 'ABC123',
    assigned_at: new Date().toISOString()
  };

  const mockWaitlist = {
    id: 'wait1',
    drop_id: '1',
    user_id: 'user1',
    joined_at: new Date().toISOString()
  };

  const mockClaimWindow = {
    id: 'window1',
    drop_id: '1',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    max_claims: 100
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pool = require('../../config/db') as jest.Mocked<Pool>;
  });

  describe('User Management', () => {
    describe('getUser', () => {
      it('should return a user by id', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

        const result = await AdminService.getUser('1');

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['1']);
        expect(result).toEqual(mockUser);
      });

      it('should throw an error when user not found', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });

        await expect(AdminService.getUser('999')).rejects.toThrow('User not found');
      });
    });

    describe('getUsers', () => {
      it('should return all users', async () => {
        const mockUsers = [mockUser, { ...mockUser, id: '2', username: 'anotheruser' }];
        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockUsers, rowCount: mockUsers.length });

        const result = await AdminService.getUsers();

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users');
        expect(result).toEqual(mockUsers);
      });
    });

    describe('updateUser', () => {
      it('should update user with provided data', async () => {
        const updatedData = { username: 'updateduser', role: 'admin' };
        (pool.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ ...mockUser, ...updatedData }], rowCount: 1 });

        const result = await AdminService.updateUser('1', updatedData);

        expect(pool.query).toHaveBeenCalledWith(
          'UPDATE users SET username = $1, name = $2, role = $3 WHERE id = $4 RETURNING *',
          [updatedData.username, mockUser.name, updatedData.role, '1']
        );
        expect(result).toEqual(expect.objectContaining(updatedData));
      });
    });

    describe('deleteUser', () => {
      it('should delete a user', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1, rows: [mockUser] });

        const result = await AdminService.deleteUser('1');

        expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1 RETURNING *', ['1']);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Claim Management', () => {
    describe('getClaims', () => {
      it('should return all claims', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockClaim], rowCount: 1 });

        const result = await AdminService.getClaims();

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM claim_codes');
        expect(result).toEqual([mockClaim]);
      });
    });

    describe('deleteClaim', () => {
      it('should delete a claim', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1, rows: [mockClaim] });

        const result = await AdminService.deleteClaim('claim1');

        expect(pool.query).toHaveBeenCalledWith('DELETE FROM claim_codes WHERE id = $1 RETURNING *', ['claim1']);
        expect(result).toBeDefined();
      });
    });

    describe('createClaimWindow', () => {
      it('should create a new claim window', async () => {
        const windowData = {
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          maxClaims: 100
        };

        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockClaimWindow], rowCount: 1 });

        const result = await AdminService.createClaimWindow('1', windowData);

        expect(pool.query).toHaveBeenCalledWith(
          'INSERT INTO claim_windows (drop_id, start_time, end_time, max_claims) VALUES ($1, $2, $3, $4) RETURNING *',
          ['1', windowData.startTime, windowData.endTime, windowData.maxClaims]
        );
        expect(result).toEqual(mockClaimWindow);
      });
    });

    describe('assignClaim', () => {
      it('should assign a claim to a user', async () => {
        const claimData = {
          userId: 'user1',
          code: 'CLAIM123',
          dropId: 'drop1',
        };

        const mockClaim = {
          id: 'claim1',
          window_id: 'window1',
          drop_id: 'drop1',
          user_id: 'user1',
          code: 'CLAIM123',
          assigned_at: new Date(),
        };

        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockClaim], rowCount: 1 });

        const result = await AdminService.assignClaim('window1', claimData);

        expect(pool.query).toHaveBeenCalledWith(
          'INSERT INTO claim_codes (window_id, drop_id, user_id, code, assigned_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          ['window1', claimData.dropId, claimData.userId, claimData.code, expect.any(Date)]
        );

        expect(result).toEqual(mockClaim);
      });
    });

    describe('getDropWaitlist', () => {
      it('should return waitlist for a drop', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockWaitlist], rowCount: 1 });

        const result = await AdminService.getDropWaitlist('1');

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM waitlist WHERE drop_id = $1', ['1']);
        expect(result).toEqual([mockWaitlist]);
      });
    });

    describe('getDropClaims', () => {
      it('should return claims for a drop', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockClaim], rowCount: 1 });

        const result = await AdminService.getDropClaims('1');

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM claim_codes WHERE drop_id = $1', ['1']);
        expect(result).toEqual([mockClaim]);
      });
    });
  });
});