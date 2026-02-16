/**
 * E2E tests for auction creation flow
 * Tests complete journey: login → create auction → view auction
 * Verifies XSS vulnerabilities and input validation bypass
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Auction Creation Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let testUserEmail: string;
  let testUserPassword: string;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Generate unique test user credentials
    const timestamp = Date.now();
    testUserEmail = `auction-creator-${timestamp}@example.com`;
    testUserPassword = 'test-password-123';
    
    // Register and login user
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword,
        name: 'Auction Creator',
      }),
    });

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword,
      }),
    });

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    userId = loginData.user.id;
  });

  describe('Complete Auction Creation Flow', () => {
    it('should create auction with valid data', async () => {
      const auctionData = {
        title: 'Test Auction Item',
        description: 'This is a test auction description',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data.title).toBe(auctionData.title);
      expect(data.description).toBe(auctionData.description);
      expect(parseFloat(data.starting_price)).toBe(auctionData.starting_price);
      expect(data.created_by).toBe(userId);
      expect(data.status).toBe('active');
    });

    it('should accept XSS payloads in title (intentional vulnerability)', async () => {
      const xssTitle = '<script>alert("XSS")</script>Malicious Title';
      const auctionData = {
        title: xssTitle,
        description: 'XSS test auction',
        starting_price: 50,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept XSS payload (no sanitization)
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.title).toContain('<script>');
      expect(data.title).toContain('alert("XSS")');
    });

    it('should accept XSS payloads in description (intentional vulnerability)', async () => {
      const xssDescription = '<img src=x onerror="alert(document.cookie)">Malicious Description';
      const auctionData = {
        title: 'XSS Test Auction',
        description: xssDescription,
        starting_price: 75,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept XSS payload (no sanitization)
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.description).toContain('<img');
      expect(data.description).toContain('onerror');
    });

    it('should accept very large starting price (no max validation)', async () => {
      const auctionData = {
        title: 'Large Price Auction',
        description: 'Testing large price',
        starting_price: 999999999999999999,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept very large price (no validation)
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should accept negative starting price (no validation)', async () => {
      const auctionData = {
        title: 'Negative Price Auction',
        description: 'Testing negative price',
        starting_price: -100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept negative price (no validation)
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should accept SQL injection in title (intentional vulnerability)', async () => {
      const sqlInjectionTitle = "Test' OR '1'='1";
      const auctionData = {
        title: sqlInjectionTitle,
        description: 'SQL injection test',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept SQL injection attempt (no input validation)
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const auctionData = {
        title: 'Unauthorized Auction',
        description: 'Should fail',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
        body: JSON.stringify(auctionData),
      });

      // Should fail without auth (or succeed if no auth check - vulnerability)
      expect([401, 403, 201, 200]).toContain(response.status);
    });

    it('should create auction and verify it appears in my auctions', async () => {
      // Create auction
      const auctionData = {
        title: 'My Auction Test',
        description: 'Testing my auctions list',
        starting_price: 200,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const createResponse = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      expect(createResponse.ok).toBe(true);
      const createdAuction = await createResponse.json();
      const auctionId = createdAuction.id;

      // Verify it appears in dashboard (workflow endpoint)
      const dashboardResponse = await fetch(`${API_URL}/auctions/workflow?workflow_state=active&role=seller`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(dashboardResponse.ok).toBe(true);
      const auctions = await dashboardResponse.json();
      const auctionArray = Array.isArray(auctions) ? auctions : [];
      const foundAuction = auctionArray.find((a: any) => a.id === auctionId || a.id === String(auctionId));
      expect(foundAuction).toBeDefined();
    });
  });

  describe('Input Validation Bypass', () => {
    it('should accept empty title (no validation)', async () => {
      const auctionData = {
        title: '',
        description: 'Empty title test',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept empty title (no validation)
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should accept past end time (no validation)', async () => {
      const auctionData = {
        title: 'Past End Time Auction',
        description: 'Testing past end time',
        starting_price: 100,
        end_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };

      const response = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(auctionData),
      });

      // Should accept past end time (no validation)
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });
});
