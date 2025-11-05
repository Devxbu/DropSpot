import { Pool } from 'pg';
import AdminService from './admin.service';

// Mock the pg pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

describe('AdminService', () => {
  let pool: jest.Mocked<Pool>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    pool = require('../../config/db') as jest.Mocked<Pool>;
  });

  describe('User Management', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      role: 'user'
    };

    describe('getUser', () => {
      it('should return a user by id', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as never);
        
        const result = await AdminService.getUser('1');
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['1']);
        expect(result).toEqual(mockUser);
      });

      it('should throw an error when user not found', async () => {
        pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
        
        await expect(AdminService.getUser('999')).rejects.toThrow();
      });
    });

    describe('getUsers', () => {
      it('should return all users', async () => {
        const mockUsers = [mockUser, { ...mockUser, id: '2', username: 'anotheruser' }];
        pool.query.mockResolvedValueOnce({ rows: mockUsers, rowCount: mockUsers.length } as never);
        
        const result = await AdminService.getUsers();
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users');
        expect(result).toEqual(mockUsers);
      });
    });

    describe('updateUser', () => {
      it('should update user with provided data', async () => {
        const updatedData = { username: 'updateduser', role: 'admin' };
        pool.query
          .mockResolvedValueOnce({ rows: [mockUser] } as never) // First call for getting user
          .mockResolvedValueOnce({ rows: [{ ...mockUser, ...updatedData }] } as never); // Update call
        
        const result = await AdminService.updateUser('1', updatedData);
        
        expect(pool.query).toHaveBeenCalledWith(
          'UPDATE users SET username = $1, name = $2, role = $3 WHERE id = $4',
          [updatedData.username, mockUser.name, updatedData.role, '1']
        );
        expect(result).toEqual(expect.objectContaining(updatedData));
      });
    });

    describe('deleteUser', () => {
      it('should delete a user', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 } as never);
        
        await AdminService.deleteUser('1');
        
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['1']);
      });
    });
  });

  describe('Drop Management', () => {
    const mockDrop = {
      id: '1',
      title: 'Test Drop',
      description: 'Test Description',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 86400000).toISOString()
    };

    describe('createDrop', () => {
      it('should create a new drop', async () => {
        const dropData = {
          title: 'New Drop',
          description: 'New Description',
          startTime: mockDrop.start_time,
          endTime: mockDrop.end_time
        };
        
        pool.query.mockResolvedValueOnce({ rows: [mockDrop] } as never);
        
        const result = await AdminService.createDrop(dropData);
        
        expect(pool.query).toHaveBeenCalledWith(
          'INSERT INTO drops (title, description, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
          [dropData.title, dropData.description, dropData.startTime, dropData.endTime]
        );
        expect(result).toEqual(mockDrop);
      });
    });

    describe('updateDrop', () => {
      it('should update a drop with provided data', async () => {
        const updateData = {
          title: 'Updated Drop',
          description: 'Updated Description'
        };
        
        pool.query
          .mockResolvedValueOnce({ rows: [mockDrop] } as never) // Get existing drop
          .mockResolvedValueOnce({ rows: [{ ...mockDrop, ...updateData }] } as never); // Update call
        
        const result = await AdminService.updateDrop('1', updateData);
        
        expect(pool.query).toHaveBeenCalledWith(
          'UPDATE drops SET title = $1, description = $2, start_time = $3, end_time = $4 WHERE id = $5 RETURNING *',
          [
            updateData.title,
            updateData.description,
            mockDrop.start_time,
            mockDrop.end_time,
            '1'
          ]
        );
        expect(result).toEqual(expect.objectContaining(updateData));
      });
    });

    describe('getDrop', () => {
      it('should return a drop by id', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockDrop] } as never);
        
        const result = await AdminService.getDrop('1');
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM drops WHERE id = $1', ['1']);
        expect(result).toEqual(mockDrop);
      });
    });

    describe('getDrops', () => {
      it('should return all drops', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockDrop] } as never);
        
        const result = await AdminService.getDrops();
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM drops');
        expect(result).toEqual([mockDrop]);
      });
    });

    describe('deleteDrop', () => {
      it('should delete a drop', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 } as never);
        
        await AdminService.deleteDrop('1');
        
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM drops WHERE id = $1', ['1']);
      });
    });
  });

  describe('Claim Management', () => {
    const mockClaim = {
      id: 'claim1',
      window_id: 'window1',
      user_id: 'user1',
      code: 'CLAIM123',
      assigned_at: new Date().toISOString()
    };

    describe('getClaims', () => {
      it('should return all claims', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockClaim] } as never);
        
        const result = await AdminService.getClaims();
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM claim_codes');
        expect(result).toEqual([mockClaim]);
      });
    });

    describe('deleteClaim', () => {
      it('should delete a claim', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 } as never);
        
        await AdminService.deleteClaim('claim1');
        
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM claim_codes WHERE id = $1', ['claim1']);
      });
    });

    describe('createClaimWindow', () => {
      it('should create a new claim window', async () => {
        const windowData = {
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          maxClaims: 100
        };
        
        const mockWindow = { id: 'window1', ...windowData };
        pool.query.mockResolvedValueOnce({ rows: [mockWindow] } as never);
        
        const result = await AdminService.createClaimWindow('drop1', windowData);
        
        expect(pool.query).toHaveBeenCalledWith(
          'INSERT INTO claim_windows (drop_id, start_time, end_time, max_claims) VALUES ($1, $2, $3, $4) RETURNING *',
          ['drop1', windowData.startTime, windowData.endTime, windowData.maxClaims]
        );
        expect(result).toEqual(mockWindow);
      });
    });

    describe('assignClaim', () => {
      it('should assign a claim to a user', async () => {
        const claimData = {
          userId: 'user1',
          code: 'CLAIM123'
        };
        
        pool.query.mockResolvedValueOnce({ rows: [mockClaim] } as never);
        
        const result = await AdminService.assignClaim('window1', claimData);
        
        expect(pool.query).toHaveBeenCalledWith(
          'INSERT INTO claim_codes (window_id, user_id, code, assigned_at) VALUES ($1, $2, $3, $4) RETURNING *',
          ['window1', claimData.userId, claimData.code, expect.any(Date)]
        );
        expect(result).toEqual(mockClaim);
      });
    });

    describe('getDropWaitlist', () => {
      it('should return waitlist for a drop', async () => {
        const mockWaitlist = [
          { id: 'wait1', drop_id: '1', user_id: 'user1', joined_at: new Date().toISOString() }
        ];
        
        pool.query.mockResolvedValueOnce({ rows: mockWaitlist } as never);
        
        const result = await AdminService.getDropWaitlist('1');
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM drop_waitlist WHERE drop_id = $1', ['1']);
        expect(result).toEqual(mockWaitlist);
      });
    });

    describe('getDropClaims', () => {
      it('should return claims for a drop', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockClaim] } as never);
        
        const result = await AdminService.getDropClaims('drop1');
        
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM claim_codes WHERE drop_id = $1', ['drop1']);
        expect(result).toEqual([mockClaim]);
      });
    });
  });
});