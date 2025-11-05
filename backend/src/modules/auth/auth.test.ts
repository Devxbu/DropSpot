import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createServer } from 'http';
import authRoutes from './auth.routes';
import pool from '../../config/db';
import { env } from '../../config/env';

// TypeScript için
const test = true;

// Mock database bağlantısı
jest.mock('../../config/db', () => {
  const mockPool = new Pool();
  return {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
});

// Mock JWT fonksiyonları
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
  verify: jest.fn((token, secret, callback) => {
    const validTokens = ['valid-refresh-token', 'valid-token'];
    const decoded = { userId: 'test-user-id' };

    // Callback'li kullanım
    if (typeof callback === 'function') {
      if (validTokens.includes(token)) {
        return callback(null, decoded);
      }
      return callback(new Error('Invalid token'), null);
    }

    // Doğrudan dönüş (senin AuthService bunu kullanıyor)
    if (validTokens.includes(token)) {
      return decoded;
    }

    throw new Error('Invalid token');
  }),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mocked-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((plain, hashed) => {
    return plain === 'correctpassword'
      ? Promise.resolve(true)
      : Promise.resolve(false);
  }),
}));

describe('Auth Module', () => {
  let app: express.Application;
  let server: any;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    server = createServer(app);
  });

  afterAll(() => {
    jest.clearAllMocks();
    server.close();
  });

  // --- REGISTER ---
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // kullanıcı yok
        .mockResolvedValueOnce({ rows: [mockUser] }); // kullanıcı eklendi

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
          username: 'testuser',
          name: 'Test User',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 400 if user already exists', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'existing@example.com',
          password: 'Test@123',
          username: 'existinguser',
          name: 'Existing User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });
  });

  // --- LOGIN ---
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 400 with invalid credentials', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  // --- REFRESH TOKEN ---
  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'test-user-id', refresh_token: 'valid-refresh-token' }],
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 400 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // --- LOGOUT ---
  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'test-user-id', refresh_token: 'valid-refresh-token' }],
        }) // SELECT
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE

      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  // --- PROFILE ---
  describe('GET /auth/profile', () => {
    it('should get user profile with valid token', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
        }],
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });
  });
});
