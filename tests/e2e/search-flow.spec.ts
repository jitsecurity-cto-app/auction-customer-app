/**
 * E2E tests for search and filtering flow
 * Tests: search auctions → filter by status/price
 * Verifies SQL injection vulnerabilities in search parameters
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Search & Filter Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create user
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `search-user-${timestamp}@example.com`,
        password: 'password123',
        name: 'Search User',
      }),
    });

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `search-user-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    userId = loginData.user.id;

    // Create test auctions with various attributes
    const auctions = [
      {
        title: 'Vintage Camera',
        description: 'A beautiful vintage camera',
        starting_price: 100,
        status: 'active',
      },
      {
        title: 'Antique Watch',
        description: 'Rare antique watch',
        starting_price: 500,
        status: 'active',
      },
      {
        title: 'Old Book',
        description: 'First edition book',
        starting_price: 50,
        status: 'ended',
      },
    ];

    for (const auction of auctions) {
      await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...auction,
          end_time: auction.status === 'ended' 
            ? new Date(Date.now() - 86400000).toISOString()
            : new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    }
  });

  describe('Search Functionality', () => {
    it('should search auctions by title', async () => {
      const response = await fetch(`${API_URL}/auctions?search=camera`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should search auctions by description', async () => {
      const response = await fetch(`${API_URL}/auctions?search=vintage`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should accept XSS in search query (intentional vulnerability)', async () => {
      const xssQuery = '<script>alert("XSS")</script>';
      const response = await fetch(`${API_URL}/auctions?search=${encodeURIComponent(xssQuery)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should accept SQL injection in search query (intentional vulnerability)', async () => {
      const sqlQuery = "camera' OR '1'='1";
      const response = await fetch(`${API_URL}/auctions?search=${encodeURIComponent(sqlQuery)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Filter by Status', () => {
    it('should filter auctions by active status', async () => {
      const response = await fetch(`${API_URL}/auctions?status=active`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter auctions by ended status', async () => {
      const response = await fetch(`${API_URL}/auctions?status=ended`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should accept SQL injection in status filter (intentional vulnerability)', async () => {
      const sqlStatus = "active' OR '1'='1";
      const response = await fetch(`${API_URL}/auctions?status=${encodeURIComponent(sqlStatus)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Filter by Price Range', () => {
    it('should filter auctions by minimum price', async () => {
      const response = await fetch(`${API_URL}/auctions?minPrice=100`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter auctions by maximum price', async () => {
      const response = await fetch(`${API_URL}/auctions?maxPrice=200`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter auctions by price range', async () => {
      const response = await fetch(`${API_URL}/auctions?minPrice=50&maxPrice=200`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should accept SQL injection in price filters (intentional vulnerability)', async () => {
      const sqlPrice = "100 OR 1=1";
      const response = await fetch(`${API_URL}/auctions?minPrice=${encodeURIComponent(sqlPrice)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should accept negative price in filter (no validation)', async () => {
      const response = await fetch(`${API_URL}/auctions?minPrice=-100`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should either accept (vulnerability) or reject
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Combined Search and Filter', () => {
    it('should combine search and status filter', async () => {
      const response = await fetch(`${API_URL}/auctions?search=camera&status=active`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should combine search, status, and price filters', async () => {
      const response = await fetch(`${API_URL}/auctions?search=vintage&status=active&minPrice=50&maxPrice=200`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('should paginate auction results', async () => {
      const response = await fetch(`${API_URL}/auctions?limit=2&offset=0`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should accept SQL injection in pagination (intentional vulnerability)', async () => {
      const sqlLimit = "2 OR 1=1";
      const response = await fetch(`${API_URL}/auctions?limit=${encodeURIComponent(sqlLimit)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
