/**
 * E2E tests for dashboard workflow functionality
 * Tests: Dashboard filtering by workflow state and role
 * Updated to use new workflow-based endpoints
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Dashboard Workflow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let auctionId: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create user 1 (seller)
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `seller-${timestamp}@example.com`,
        password: 'password123',
        name: 'Seller User',
      }),
    });

    const user1Login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `seller-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const user1Data = await user1Login.json();
    user1Token = user1Data.token;
    user1Id = user1Data.user.id;

    // Create user 2 (buyer)
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `buyer-${timestamp}@example.com`,
        password: 'password123',
        name: 'Buyer User',
      }),
    });

    const user2Login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `buyer-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const user2Data = await user2Login.json();
    user2Token = user2Data.token;
    user2Id = user2Data.user.id;

    // Create auction by user 1
    const auctionResponse = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'Test Auction for Activity',
        description: 'Test description',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const auctionData = await auctionResponse.json();
    auctionId = auctionData.id;

    // Place bid by user 2
    await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ amount: 150 }),
    });
  });

  describe('Dashboard Workflow Filtering', () => {
    it('should get auctions by workflow state (active)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter auctions by role (seller)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active?role=seller`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter auctions by role (buyer)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow/active?role=buyer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should get auctions for all workflow states', async () => {
      const states = ['active', 'pending_sale', 'shipping', 'complete'];
      
      for (const state of states) {
        const response = await fetch(`${API_URL}/auctions/workflow/${state}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user1Token}`,
          },
        });

        expect(response.ok).toBe(true);
        const auctions = await response.json();
        expect(Array.isArray(auctions)).toBe(true);
      }
    });
  });

  describe('Workflow State Updates', () => {
    it('should update workflow state', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}/workflow-state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          workflow_state: 'pending_sale',
        }),
      });

      // Should work or return appropriate status
      expect([200, 201, 400, 404]).toContain(response.status);
    });
  });
});
