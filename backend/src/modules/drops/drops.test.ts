import { Pool } from 'pg';
import pool from '../../config/db';
import DropService from './drops.service';
import { createDropsTable, createWaitlistTable } from './drops.model';

// Mock the pool module
jest.mock('../../config/db');

// Type for our mock query function
interface MockQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Create a type-safe mock for the pool
const mockPool = pool as jest.Mocked<typeof pool>;

// Mock the pool.query method
const mockQuery = mockPool.query as jest.Mock;

describe('DropService', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    
    // Default mock implementation for client.query
    (mockClient.query as jest.Mock).mockImplementation((query: string) => {
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
  });

  describe('getDrops', () => {
    it('should return drops when they exist', async () => {
      const mockDrops = [
        { id: '1', title: 'Test Drop 1' },
        { id: '2', title: 'Test Drop 2' },
      ];
      
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockDrops, rowCount: 2 });
      
      const result = await DropService.getDrops();
      expect(result).toEqual(mockDrops);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM drops ORDER BY created_at DESC'
      );
    });

    it('should throw an error when no drops are found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(DropService.getDrops()).rejects.toThrow('No drops found');
    });
  });

  describe('getDrop', () => {
    it('should return a single drop when it exists', async () => {
      const mockDrop = { id: '1', title: 'Test Drop' };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDrop], rowCount: 1 });
      
      const result = await DropService.getDrop('1');
      expect(result).toEqual(mockDrop);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM drops WHERE id = $1',
        ['1']
      );
    });

    it('should throw an error when drop is not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(DropService.getDrop('nonexistent')).rejects.toThrow('Drop not found');
    });
  });

  describe('addWaitlist', () => {
    const dropId = 'drop-1';
    const userId = 'user-1';
    const now = new Date();
    const userCreatedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    
    beforeEach(() => {
      // Mock client setup
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // SET TRANSACTION
        .mockResolvedValueOnce({ 
          rows: [{ id: dropId, start_time: now, end_time: new Date(now.getTime() + 3600000) }] 
        }) // Check drop exists
        .mockResolvedValueOnce({ rows: [] }) // Check if user already in waitlist
        .mockResolvedValueOnce({ 
          rows: [{ 
            created_at: userCreatedAt, 
            recent_joins: 0 
          }] 
        }) // Get user info
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 'waitlist-1', 
            drop_id: dropId, 
            user_id: userId 
          }] 
        }); // Insert waitlist
    });

    it('should add user to waitlist successfully', async () => {
      const result = await DropService.addWaitlist(dropId, userId);
      
      expect(result).toBeDefined();
      expect(result.drop_id).toBe(dropId);
      expect(result.user_id).toBe(userId);
      expect(mockClient.query).toHaveBeenCalledTimes(7); // BEGIN, SET, 4 queries, COMMIT
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw error when drop is not active', async () => {
      // Override the drop check to return no rows
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // SET TRANSACTION
        .mockResolvedValueOnce({ rows: [] }); // Drop not found

      await expect(DropService.addWaitlist(dropId, userId)).rejects.toThrow('Drop not found or not active');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error when user already in waitlist', async () => {
      // Override the waitlist check to return existing entry
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // SET TRANSACTION
        .mockResolvedValueOnce({ 
          rows: [{ id: dropId, start_time: now, end_time: new Date(now.getTime() + 3600000) }] 
        }) // Check drop exists
        .mockResolvedValueOnce({ rows: [{ id: 'existing-waitlist' }] }); // User already in waitlist

      await expect(DropService.addWaitlist(dropId, userId)).rejects.toThrow('User already joined the waitlist');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('removeWaitlist', () => {
    it('should remove user from waitlist successfully', async () => {
      const dropId = 'drop-1';
      const userId = 'user-1';
      
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{}], rowCount: 1 });
      
      const result = await DropService.removeWaitlist('drop-1', 'user-1');
      expect(result).toBeDefined();
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM waitlist WHERE drop_id = $1 AND user_id = $2 RETURNING *',
        ['drop-1', 'user-1']
      );
    });

    it('should throw error when user not in waitlist', async () => {
      const dropId = 'drop-1';
      const userId = 'user-1';
      
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(DropService.removeWaitlist('drop-1', 'user-1')).rejects.toThrow('User was not on the waitlist or already removed');
    });
  });
});

describe('Database Tables', () => {
  it('should create drops table with correct schema', async () => {
    // Reset and type the mock query
    (mockPool.query as jest.Mock).mockClear();
    await createDropsTable();
    
    // Verify the table creation query was called
    const queryCalls = (mockPool.query as jest.Mock).mock.calls;
    const createTableQuery = queryCalls.find((call: [string]) => 
      call[0].includes('CREATE TABLE IF NOT EXISTS drops')
    );
    expect(createTableQuery).toBeDefined();
    
    // Verify indexes were created
    const indexCalls = queryCalls.filter((call: [string]) => 
      typeof call[0] === 'string' && call[0].includes('CREATE INDEX')
    );
    expect(indexCalls.some((call: [string]) => call[0].includes('idx_drops_created_at'))).toBe(true);
    expect(indexCalls.some((call: [string]) => call[0].includes('idx_drops_title_unique'))).toBe(true);
  });

  it('should create waitlist table with correct schema', async () => {
    // Reset and type the mock query
    (mockPool.query as jest.Mock).mockClear();
    
    await createWaitlistTable();
    
    // Verify the table creation query was called
    const queryCalls = (mockPool.query as jest.Mock).mock.calls;
    const createTableQuery = queryCalls.find((call: [string]) => 
      call[0].includes('CREATE TABLE IF NOT EXISTS waitlist')
    );
    expect(createTableQuery).toBeDefined();
    
    // Verify indexes were created
    const indexCalls = queryCalls.filter((call: [string]) => 
      typeof call[0] === 'string' && call[0].includes('CREATE INDEX')
    );
    expect(indexCalls.some((call: [string]) => call[0].includes('idx_waitlist_priority'))).toBe(true);
    expect(indexCalls.some((call: [string]) => call[0].includes('idx_waitlist_user'))).toBe(true);
  });
});