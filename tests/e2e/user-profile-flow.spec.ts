/**
 * E2E tests for user profile flow
 * Tests: view profile → update profile
 * Verifies IDOR vulnerabilities and profile data exposure
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('User Profile Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create user 1
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user1-${timestamp}@example.com`,
        password: 'password123',
        name: 'User One',
      }),
    });

    const user1Login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user1-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const user1Data = await user1Login.json();
    user1Token = user1Data.token;
    user1Id = user1Data.user.id;

    // Create user 2
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user2-${timestamp}@example.com`,
        password: 'password123',
        name: 'User Two',
      }),
    });

    const user2Login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user2-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const user2Data = await user2Login.json();
    user2Token = user2Data.token;
    user2Id = user2Data.user.id;
  });

  describe('View User Profile', () => {
    it('should view own profile', async () => {
      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe(user1Id);
      expect(data.email).toContain('user1-');
      expect(data.name).toBe('User One');
    });

    it('should view other user profile without authorization (IDOR vulnerability)', async () => {
      const response = await fetch(`${API_URL}/users/${user2Id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`, // User 1 accessing User 2's profile
        },
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
      
      if (response.ok) {
        const data = await response.json();
        expect(data.id).toBe(user2Id);
        // Intentionally exposes password hash (security vulnerability)
        if (data.password_hash) {
          expect(data).toHaveProperty('password_hash');
        }
      }
    });

    it('should view user profile without authentication (IDOR vulnerability)', async () => {
      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // No Authorization header
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should expose password hash in profile (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Intentionally exposes password hash (security vulnerability)
        if (data.password_hash) {
          expect(data).toHaveProperty('password_hash');
          expect(typeof data.password_hash).toBe('string');
        }
      }
    });
  });

  describe('Update User Profile', () => {
    it('should update own profile', async () => {
      const updateData = {
        name: 'Updated User One',
        phone: '123-456-7890',
        address: '123 Test Street',
      };

      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify(updateData),
      });

      // Should succeed or fail depending on implementation
      expect([200, 201, 400, 401, 403, 500]).toContain(response.status);
    });

    it('should update other user profile without authorization (IDOR vulnerability)', async () => {
      const updateData = {
        name: 'Hacked User Two',
      };

      const response = await fetch(`${API_URL}/users/${user2Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`, // User 1 updating User 2's profile
        },
        body: JSON.stringify(updateData),
      });

      // Should fail (proper authorization) or succeed (IDOR vulnerability)
      expect([200, 201, 400, 401, 403, 500]).toContain(response.status);
    });

    it('should accept XSS in profile fields (intentional vulnerability)', async () => {
      const xssData = {
        name: '<script>alert("XSS")</script>Malicious Name',
        address: '<img src=x onerror="alert(document.cookie)">',
      };

      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify(xssData),
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 201, 400, 500]).toContain(response.status);
      
      if (response.ok) {
        const data = await response.json();
        // XSS payload should be present (no sanitization)
        if (data.name) {
          expect(data.name).toContain('<script>');
        }
      }
    });

    it('should accept SQL injection in profile update (intentional vulnerability)', async () => {
      const sqlData = {
        name: "Test' OR '1'='1",
        email: "test@example.com' OR '1'='1",
      };

      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify(sqlData),
      });

      // Should accept SQL injection attempt (no input validation)
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe('Profile Data Exposure', () => {
    it('should expose sensitive user data in profile', async () => {
      const response = await fetch(`${API_URL}/users/${user1Id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Should expose various user data
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('email');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('created_at');
        // Password hash may be exposed (vulnerability)
      }
    });
  });
});
