const request = require('supertest');
const app = require('../app');
const { prismaMock } = require('./setup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('admin@test.com');
    });

    it('should fail with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('RBAC Protection', () => {
    it('should deny access to admin routes for non-admin users', async () => {
      const mockUser = {
        id: 2,
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'AGENT',
        isActive: true,
      };

      // Mock user lookup in protect middleware
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const token = jwt.sign({ userId: 2 }, process.env.JWT_SECRET || 'secret');

      const res = await request(app)
        .get('/api/admin/teams')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('is not authorized');
    });
  });
});
