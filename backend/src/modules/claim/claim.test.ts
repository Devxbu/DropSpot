import { Pool } from 'pg';
import ClaimService from './claim.service';

// Mock the pg pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
}));

describe('ClaimService', () => {
  let pool: jest.Mocked<Pool>;
  
  // Mock data
  const mockClaim = {
    id: 'claim1',
    user_id: 'user1',
    drop_id: 'drop1',
    code: 'ABC123',
    created_at: new Date().toISOString(),
    claimed: false,
    claimed_at: null
  };

  const mockClaimWindow = {
    id: 'window1',
    drop_id: 'drop1',
    opened_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    closed_at: null,
    max_claims: 100
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pool = require('../../config/db') as jest.Mocked<Pool>;
  });

  describe('getClaim', () => {
    it('should return a claim by id', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockClaim], rowCount: 1 });
      
      const result = await ClaimService.getClaim('claim1');
      
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM claim_codes WHERE id = $1', ['claim1']);
      expect(result).toEqual(mockClaim);
    });

    it('should throw an error when claim not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(ClaimService.getClaim('nonexistent')).rejects.toThrow('Claim not found');
    });
  });

  describe('createClaim', () => {
    it('should create a new claim when window is open', async () => {
      // Mock the claim window check
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockClaimWindow], rowCount: 1 }) // Claim window check
        .mockResolvedValueOnce({ rows: [{ ...mockClaim, code: 'GENERATED123' }], rowCount: 1 }); // Claim creation
      
      const result = await ClaimService.createClaim('user1', 'drop1');
      
      // Verify claim window check
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM claim_windows WHERE drop_id = $1 AND opened_at <= NOW() AND (closed_at IS NULL OR closed_at > NOW())',
        ['drop1']
      );
      
      // Verify claim creation with a generated code
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO claim_codes (user_id, drop_id, code, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        ['user1', 'drop1', expect.any(String)]
      );
      
      expect(result).toHaveProperty('code', 'GENERATED123');
    });

    it('should throw an error when claim window is closed', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(ClaimService.createClaim('user1', 'drop1'))
        .rejects
        .toThrow('Claim window closed');
    });
  });

  describe('redeemClaim', () => {
    it('should mark a claim as redeemed', async () => {
      const mockRedeemedClaim = {
        ...mockClaim,
        claimed: true,
        claimed_at: new Date().toISOString()
      };
      
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockRedeemedClaim], rowCount: 1 });
      
      const result = await ClaimService.redeemClaim('claim1', 'user1');
      
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE claim_codes SET claimed = TRUE, claimed_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
        ['claim1', 'user1']
      );
      expect(result).toEqual(mockRedeemedClaim);
    });

    it('should throw an error when claim not found or not owned by user', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      await expect(ClaimService.redeemClaim('nonexistent', 'user1'))
        .rejects
        .toThrow('Claim not found or not owned by user');
    });
  });
});