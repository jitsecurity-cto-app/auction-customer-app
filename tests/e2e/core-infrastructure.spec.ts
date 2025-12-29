/**
 * E2E tests for core infrastructure
 * Tests verify API client and auth utilities work together
 */

import { api, setAuthToken, removeAuthToken } from '@/lib/api';
import {
  login,
  register,
  logout,
  isAuthenticated,
  getCurrentUser,
  getToken,
  setAuth,
  getAuthToken,
} from '@/lib/auth';

// Mock fetch for E2E tests
global.fetch = jest.fn();

describe('Core Infrastructure E2E', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    removeAuthToken();
    localStorage.clear();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Step 1: Register new user
      const registerResponse = {
        id: 1,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => registerResponse,
      });

      const registeredUser = await register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(registeredUser).toEqual(registerResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
            name: 'New User',
          }),
        })
      );

      // Step 2: Login with registered credentials
      const loginResponse = {
        token: 'jwt-token-123',
        user: {
          id: 1,
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => loginResponse,
      });

      const loginResult = await login({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(loginResult).toEqual(loginResponse);
      expect(localStorage.getItem('auth_token')).toBe('jwt-token-123');
      expect(isAuthenticated()).toBe(true);

      // Step 3: Verify token and get current user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          user: loginResponse.user,
        }),
      });

      const currentUser = await getCurrentUser();

      expect(currentUser).toEqual(loginResponse.user);
      expect(getToken()).toBe('jwt-token-123');

      // Step 4: Logout
      logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it('should handle authentication errors gracefully', async () => {
      // Failed login
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        }),
      });

      await expect(
        login({ email: 'wrong@example.com', password: 'wrongpassword' })
      ).rejects.toThrow();

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('API Client with Authentication', () => {
    it('should make authenticated API requests', async () => {
      // Set token
      setAuthToken('test-token-123');

      // Make authenticated request
      const mockAuction = {
        id: 1,
        title: 'Test Auction',
        description: 'Test Description',
        starting_price: 100,
        current_bid: 100,
        status: 'active',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuction,
      });

      const auction = await api.getAuctionById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auctions/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
      expect(auction).toEqual(mockAuction);
    });

    it('should handle token expiration (no validation - intentional vulnerability)', async () => {
      // Set expired token (but no validation happens)
      setAuth('expired-token-123', {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'user',
        created_at: new Date().toISOString(),
      });
      expect(isAuthenticated()).toBe(true); // Still considered authenticated

      // Try to make request with expired token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
          message: 'Token expired',
        }),
      });

      await expect(api.getAuctionById(1)).rejects.toThrow();
    });
  });

  describe('Auction Operations Flow', () => {
    beforeEach(() => {
      setAuthToken('test-token');
    });

    it('should list auctions, get details, and place bid', async () => {
      // List auctions
      const mockAuctions = [
        {
          id: 1,
          title: 'Auction 1',
          current_bid: 100,
          status: 'active',
        },
        {
          id: 2,
          title: 'Auction 2',
          current_bid: 200,
          status: 'active',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuctions,
      });

      const auctions = await api.getAuctions();
      expect(auctions).toEqual(mockAuctions);

      // Get auction details
      const mockAuctionDetail = {
        ...mockAuctions[0],
        description: 'Full description',
        bids: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuctionDetail,
      });

      const auction = await api.getAuctionById(1);
      expect(auction).toEqual(mockAuctionDetail);

      // Get bids
      const mockBids = [
        { id: 1, amount: 100, user_id: 1 },
        { id: 2, amount: 150, user_id: 2 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBids,
      });

      const bids = await api.getBidsByAuction(1);
      expect(bids).toEqual(mockBids);

      // Place bid
      const newBid = { id: 3, amount: 200, user_id: 1 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => newBid,
      });

      const bid = await api.createBid(1, 200);
      expect(bid).toEqual(newBid);
    });
  });

  describe('Security Vulnerabilities Verification', () => {
    it('should expose tokens in localStorage (intentional vulnerability)', () => {
      const sensitiveToken = 'jwt-token-with-sensitive-data';
      setAuthToken(sensitiveToken);

      // Token is directly accessible
      const token = getToken();
      expect(token).toBe(sensitiveToken);
      expect(localStorage.getItem('auth_token')).toBe(sensitiveToken);
    });

    it('should log sensitive information (intentional vulnerability)', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Login logs credentials
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token', user: { id: 1 } }),
      });

      await login({ email: 'test@example.com', password: 'password123' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Login attempt:',
        expect.objectContaining({
          email: 'test@example.com',
        })
      );

      // API requests log tokens
      setAuthToken('test-token-123');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.getAuctions();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'API Request:',
        expect.objectContaining({
          hasToken: true,
          tokenPreview: expect.any(String),
        })
      );

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should not validate token expiration (intentional vulnerability)', () => {
      // Even clearly invalid tokens are accepted
      setAuth('invalid-token', {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'user',
        created_at: new Date().toISOString(),
      });
      expect(isAuthenticated()).toBe(true);

      // No expiration check
      const oldToken = 'old-token-from-2020';
      setAuth(oldToken, {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'user',
        created_at: new Date().toISOString(),
      });
      expect(isAuthenticated()).toBe(true);
    });
  });
});

