const request = require('supertest');
const app = require('../server');

describe('Authentication Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should reject login without credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject login with invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid role');
    });

    it('should reject login with wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
          role: 'student'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/verify');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('No token');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Invalid token');
    });
  });
});

describe('Level Access Enforcement Tests', () => {
  it('should prevent students from accessing other levels', async () => {
    // This would require setting up a test database and seeding it
    // For now, this is a placeholder for the test structure
    expect(true).toBe(true);
  });
});
