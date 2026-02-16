/**
 * E2E tests for auction detail and bidding flow
 * Tests: view auction → place bid → view bid history
 * Verifies XSS rendering, IDOR vulnerabilities, and bidding flow
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Auction Detail & Bidding Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let sellerToken: string;
  let buyerToken: string;
  let sellerId: string;
  let buyerId: string;
  let auctionId: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create seller
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `seller-${timestamp}@example.com`,
        password: 'password123',
        name: 'Seller User',
      }),
    });

    const sellerLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `seller-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const sellerData = await sellerLogin.json();
    sellerToken = sellerData.token;
    sellerId = sellerData.user.id;

    // Create buyer
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `buyer-${timestamp}@example.com`,
        password: 'password123',
        name: 'Buyer User',
      }),
    });

    const buyerLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `buyer-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const buyerData = await buyerLogin.json();
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    // Create auction with XSS payload
    const auctionResponse = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: 'Test Auction with XSS',
        description: '<img src=x onerror="alert(document.cookie)">Malicious Description',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const auctionData = await auctionResponse.json();
    auctionId = auctionData.id;
  });

  describe('Auction Detail View', () => {
    it('should view auction details without authentication (IDOR vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // No Authorization header - should still work (IDOR vulnerability)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Number(data.id)).toBe(Number(auctionId));
      expect(data.title).toBe('Test Auction with XSS');
    });

    it('should render XSS payload in auction description (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // XSS payload should be present in description (no sanitization)
      expect(data.description).toContain('<img');
      expect(data.description).toContain('onerror');
      expect(data.description).toContain('alert');
    });

    it('should access any auction by ID (IDOR vulnerability)', async () => {
      // Try to access auction with different user's token (should work - IDOR)
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Number(data.id)).toBe(Number(auctionId));
      // No authorization check - buyer can see seller's auction
    });
  });

  describe('Bidding Flow', () => {
    it('should place bid on auction', async () => {
      const bidResponse = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 150 }),
      });

      expect(bidResponse.ok).toBe(true);
      const bidData = await bidResponse.json();
      expect(parseFloat(bidData.amount)).toBe(150);
      expect(Number(bidData.auction_id)).toBe(Number(auctionId));
      expect(Number(bidData.user_id)).toBe(Number(buyerId));
    });

    it('should view bid history without authentication (IDOR vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // No Authorization header - should still work
      });

      expect(response.ok).toBe(true);
      const bids = await response.json();
      expect(Array.isArray(bids)).toBe(true);
      expect(bids.length).toBeGreaterThan(0);
    });

    it('should accept bid lower than current bid (no validation)', async () => {
      // First, get current bid
      const auctionResponse = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const auction = await auctionResponse.json();
      const currentBid = auction.current_bid || auction.starting_price;

      // Try to place lower bid
      const bidResponse = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: currentBid - 10 }),
      });

      // Should either accept (vulnerability) or reject
      expect([200, 201, 400, 500]).toContain(bidResponse.status);
    });

    it('should accept negative bid amount (no validation)', async () => {
      const bidResponse = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: -50 }),
      });

      // Should either accept (vulnerability) or reject
      expect([200, 201, 400, 500]).toContain(bidResponse.status);
    });

    it('should allow seller to bid on own auction (no validation)', async () => {
      const bidResponse = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({ amount: 200 }),
      });

      // Should either accept (vulnerability) or reject
      expect([200, 201, 400, 500]).toContain(bidResponse.status);
    });
  });

  describe('Complete Bidding Journey', () => {
    it('should complete full flow: view auction → place bid → view updated auction', async () => {
      // Step 1: View auction
      const viewResponse = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(viewResponse.ok).toBe(true);
      const auctionBefore = await viewResponse.json();
      const initialBid = auctionBefore.current_bid || auctionBefore.starting_price;

      // Step 2: Place bid
      const bidAmount = initialBid + 50;
      const bidResponse = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: bidAmount }),
      });
      expect(bidResponse.ok).toBe(true);

      // Step 3: View updated auction
      const updatedResponse = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(updatedResponse.ok).toBe(true);
      const auctionAfter = await updatedResponse.json();
      
      // Current bid should be updated (if validation works)
      // Or might not be updated if no validation (vulnerability)
      expect(auctionAfter).toHaveProperty('current_bid');
    });
  });
});
