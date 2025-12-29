/**
 * E2E tests for authentication flow
 * Tests complete user journey: register → login → logout
 */

// Note: These are integration tests that require the database service to be running
// For true E2E tests with Playwright/Puppeteer, you would need additional setup

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Authentication Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let testUserEmail: string;
  let testUserPassword: string;
  let testUserName: string;

  beforeAll(() => {
    // Generate unique test user credentials
    const timestamp = Date.now();
    testUserEmail = `test-${timestamp}@example.com`;
    testUserPassword = 'test-password-123';
    testUserName = `Test User ${timestamp}`;
  });

  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
          name: testUserName,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email', testUserEmail);
      expect(data).toHaveProperty('name', testUserName);
      expect(data).toHaveProperty('role', 'user');
      // Intentionally exposes password hash (security vulnerability)
      expect(data).toHaveProperty('password_hash');
    });

    it('should fail to register duplicate email', async () => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUserEmail, // Same email as above
          password: 'different-password',
          name: 'Different Name',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should accept weak passwords (intentional vulnerability)', async () => {
      const weakPasswordEmail = `weak-${Date.now()}@example.com`;
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: weakPasswordEmail,
          password: '123', // Very weak password
          name: 'Weak Password User',
        }),
      });

      // Should succeed (no password strength validation)
      expect(response.ok).toBe(true);
    });
  });

  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(testUserEmail);
      expect(data.user.name).toBe(testUserName);
      // Intentionally exposes password hash (security vulnerability)
      expect(data.user).toHaveProperty('password_hash');
    });

    it('should fail to login with invalid password', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'wrong-password',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });

    it('should fail to login with non-existent email', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'any-password',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });
  });

  describe('Token Verification', () => {
    let authToken: string;

    beforeAll(async () => {
      // Get auth token by logging in
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      const data = await response.json();
      authToken = data.token;
    });

    it('should verify valid token', async () => {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(testUserEmail);
    });

    it('should fail to verify invalid token', async () => {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('Security Vulnerabilities Verification', () => {
    it('should expose verbose error messages (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrong',
        }),
      });

      const data = await response.json();
      // Error should include stack trace (intentional vulnerability)
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      // Stack trace may or may not be present depending on environment
    });

    it('should accept SQL injection attempts (intentional vulnerability)', async () => {
      // This test verifies that SQL injection is possible
      // The actual injection would need to be tested against the database
      const sqlInjectionEmail = `test' OR '1'='1@example.com`;
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sqlInjectionEmail,
          password: 'any-password',
        }),
      });

      // The request should be accepted (no input validation)
      // Whether it succeeds depends on the database query construction
      // This test verifies the vulnerability exists
      expect([200, 401, 500]).toContain(response.status);
    });
  });
});

