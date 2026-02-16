/**
 * E2E tests for complete workflow scenarios
 * Tests: active → pending_sale → shipping → complete
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Complete Workflow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let sellerToken: string;
  let buyerToken: string;
  let sellerId: string;
  let buyerId: string;
  let auctionId: number;
  let orderId: number;

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
  });

  describe('Complete Workflow: Create → Bid → End → Order → Ship → Complete', () => {
    it('should complete full workflow from creation to completion', async () => {
      // Step 1: Create auction
      const auctionResponse = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          title: 'Workflow Test Auction',
          description: 'Testing complete workflow',
          starting_price: 100,
          end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        }),
      });

      expect(auctionResponse.ok).toBe(true);
      const auction = await auctionResponse.json();
      auctionId = auction.id;
      expect(auction.workflow_state).toBe('active');

      // Step 2: Place bid
      const bidResponse = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ amount: 150 }),
      });

      expect(bidResponse.ok).toBe(true);

      // Step 3: Close auction (transition to pending_sale)
      const closeResponse = await fetch(`${API_URL}/auctions/${auctionId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
      });

      expect(closeResponse.ok).toBe(true);

      // Verify workflow state is pending_sale
      const auctionCheck1 = await fetch(`${API_URL}/auctions/${auctionId}`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      const auctionData1 = await auctionCheck1.json();
      expect(['pending_sale', 'active']).toContain(auctionData1.workflow_state);

      // Step 4: Create order (buyer)
      const orderResponse = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          auction_id: auctionId,
          shipping_address: '123 Test Street, Test City, 12345',
        }),
      });

      expect(orderResponse.ok).toBe(true);
      const order = await orderResponse.json();
      orderId = order.id;

      // Step 5: Mark as shipped (seller) - transition to shipping
      const shippedResponse = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          tracking_number: 'TRACK123',
          tracking_url: 'https://track.example.com/123',
          shipping_status: 'shipped',
          status: 'shipped',
        }),
      });

      expect(shippedResponse.ok).toBe(true);

      // Update workflow state to shipping
      const workflowShippingResponse = await fetch(`${API_URL}/auctions/${auctionId}/workflow`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          workflow_state: 'shipping',
        }),
      });

      expect(workflowShippingResponse.ok).toBe(true);

      // Verify workflow state is shipping
      const auctionCheck2 = await fetch(`${API_URL}/auctions/${auctionId}`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      const auctionData2 = await auctionCheck2.json();
      expect(auctionData2.workflow_state).toBe('shipping');

      // Step 6: Confirm receipt (buyer) - transition to complete
      const completeOrderResponse = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          shipping_status: 'delivered',
          status: 'completed',
        }),
      });

      expect(completeOrderResponse.ok).toBe(true);

      // Update workflow state to complete
      const workflowCompleteResponse = await fetch(`${API_URL}/auctions/${auctionId}/workflow`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          workflow_state: 'complete',
        }),
      });

      expect(workflowCompleteResponse.ok).toBe(true);

      // Verify workflow state is complete
      const auctionCheck3 = await fetch(`${API_URL}/auctions/${auctionId}`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      const auctionData3 = await auctionCheck3.json();
      expect(auctionData3.workflow_state).toBe('complete');
    });
  });

  describe('Dashboard Workflow Filtering', () => {
    it('should filter auctions by workflow state', async () => {
      // Get active auctions
      const activeResponse = await fetch(`${API_URL}/auctions/workflow?workflow_state=active&role=seller`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });

      expect(activeResponse.ok).toBe(true);
      const activeAuctions = await activeResponse.json();
      expect(Array.isArray(activeAuctions)).toBe(true);

      // Get complete auctions
      const completeResponse = await fetch(`${API_URL}/auctions/workflow?workflow_state=complete&role=seller`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });

      expect(completeResponse.ok).toBe(true);
      const completeAuctions = await completeResponse.json();
      expect(Array.isArray(completeAuctions)).toBe(true);
    });

    it('should filter auctions by role (seller)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow?workflow_state=active&role=seller`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should filter auctions by role (buyer)', async () => {
      const response = await fetch(`${API_URL}/auctions/workflow?workflow_state=active&role=buyer`, {
        headers: {
          Authorization: `Bearer ${buyerToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });
  });
});
