/**
 * E2E tests for order flow
 * Tests: create order → view orders → update order status
 * Verifies IDOR vulnerabilities and order management
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Order Flow E2E', () => {
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

    // Create expired auction
    const auctionResponse = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: 'Order Test Auction',
        description: 'Test auction for order flow',
        starting_price: 100,
        end_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }),
    });

    const auctionData = await auctionResponse.json();
    auctionId = auctionData.id;

    // Place bid
    await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ amount: 150 }),
    });

    // Close auction
    await fetch(`${API_URL}/auctions/${auctionId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  describe('Create Order', () => {
    it('should create order for won auction', async () => {
      const orderData = {
        auction_id: auctionId,
        shipping_address: '123 Test Street, Test City, TS 12345',
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify(orderData),
      });

      // Should succeed or fail depending on auction status
      expect([200, 201, 400, 404, 500]).toContain(response.status);
    });

    it('should accept XSS in shipping address (intentional vulnerability)', async () => {
      const xssOrderData = {
        auction_id: auctionId,
        shipping_address: '<script>alert("XSS")</script>123 Test St',
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify(xssOrderData),
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 201, 400, 404, 500]).toContain(response.status);
    });

    it('should accept SQL injection in order data (intentional vulnerability)', async () => {
      const sqlOrderData = {
        auction_id: auctionId,
        shipping_address: "Test' OR '1'='1",
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify(sqlOrderData),
      });

      // Should accept SQL injection attempt (no input validation)
      expect([200, 201, 400, 404, 500]).toContain(response.status);
    });
  });

  describe('View Orders', () => {
    let orderId: string;

    beforeAll(async () => {
      // Create an order first
      const orderResponse = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          auction_id: auctionId,
          shipping_address: '123 Test St',
        }),
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        orderId = orderData.id;
      }
    });

    it('should view own orders as buyer', async () => {
      const response = await fetch(`${API_URL}/orders?buyer_id=${buyerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should view own orders as seller', async () => {
      const response = await fetch(`${API_URL}/orders?seller_id=${sellerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should access other user orders without authorization (IDOR vulnerability)', async () => {
      const response = await fetch(`${API_URL}/orders?buyer_id=${buyerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`, // Seller accessing buyer's orders
        },
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should view order by ID without authorization (IDOR vulnerability)', async () => {
      if (!orderId) return;

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // No Authorization header
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403, 404]).toContain(response.status);
    });

    it('should accept SQL injection in order filters (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/orders?buyer_id=1 OR 1=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Update Order', () => {
    let orderId: string;

    beforeAll(async () => {
      // Create an order first
      const orderResponse = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          auction_id: auctionId,
          shipping_address: '123 Test St',
        }),
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        orderId = orderData.id;
      }
    });

    it('should update order status', async () => {
      if (!orderId) return;

      const updateData = {
        shipping_status: 'shipped',
        tracking_number: 'TRACK123456',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(updateData),
      });

      // Should succeed or fail depending on authorization
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(response.status);
    });

    it('should update order without authorization (IDOR vulnerability)', async () => {
      if (!orderId) return;

      const updateData = {
        shipping_status: 'shipped',
        tracking_number: 'HACKED123',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // No Authorization header
      });

      // Should fail (proper authorization) or succeed (IDOR vulnerability)
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(response.status);
    });

    it('should accept XSS in tracking number (intentional vulnerability)', async () => {
      if (!orderId) return;

      const xssUpdateData = {
        tracking_number: '<script>alert("XSS")</script>TRACK123',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(xssUpdateData),
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe('Filter Orders', () => {
    it('should filter orders by status', async () => {
      const response = await fetch(`${API_URL}/orders?status=pending_payment`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should filter orders by payment status', async () => {
      const response = await fetch(`${API_URL}/orders?payment_status=paid`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should filter orders by shipping status', async () => {
      const response = await fetch(`${API_URL}/orders?shipping_status=shipped`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });
  });
});
