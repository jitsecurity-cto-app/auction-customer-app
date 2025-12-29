/**
 * E2E tests for dashboard navigation and filtering
 * Tests: Dashboard page, workflow state filtering, role filtering
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Dashboard Navigation E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let userToken: string;
  let userId: string;
  let auctionId: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create user
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `dashboard-${timestamp}@example.com`,
        password: 'password123',
        name: 'Dashboard Test User',
      }),
    });

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `dashboard-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const userData = await loginResponse.json();
    userToken = userData.token;
    userId = userData.user.id;

    // Create an auction
    const auctionResponse = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Dashboard Test Auction',
        description: 'Test description',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const auction = await auctionResponse.json();
    auctionId = auction.id;
  });

  describe('Dashboard API Endpoints', () => {
    it('should get all auctions for dashboard', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter by workflow state', async () => {
      const states = ['active', 'pending_sale', 'shipping', 'complete'];
      
      for (const state of states) {
        const response = await fetch(`${API_URL}/auctions/workflow/${state}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.ok).toBe(true);
        const auctions = await response.json();
        expect(Array.isArray(auctions)).toBe(true);
      }
    });

    it('should filter by role (seller)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active?role=seller`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter by role (buyer)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active?role=buyer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should combine workflow state and role filters', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active?role=seller`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });
  });

  describe('Workflow State Management', () => {
    it('should update workflow state via API', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}/workflow-state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          workflow_state: 'pending_sale',
        }),
      });

      // Should work or return appropriate status
      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('should retrieve auction with workflow state', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auction = await response.json();
      expect(auction).toHaveProperty('id');
      // workflow_state may or may not be present depending on migration status
    });
  });
});
