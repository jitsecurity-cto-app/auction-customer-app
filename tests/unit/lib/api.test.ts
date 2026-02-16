import { apiRequest, api } from '../../../src/lib/api';
import { AuthResponse } from '../../../src/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('apiRequest', () => {
    it('makes GET request successfully', async () => {
      const mockData = { id: '1', title: 'Test Auction' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiRequest('/auctions');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auctions'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('makes POST request with body', async () => {
      const mockData = { token: 'test-token', user: { id: '1' } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const body = { email: 'test@example.com', password: 'password123' };
      const result = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('includes Authorization header when requireAuth is true', async () => {
      // Mock localStorage
      const mockToken = 'test-token';
      Storage.prototype.getItem = jest.fn().mockReturnValue(mockToken);

      const mockData = { id: '1' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await apiRequest('/users/1', { method: 'GET', requireAuth: true });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('throws error on non-ok response', async () => {
      const errorResponse = {
        error: 'Unauthorized',
        message: 'Invalid token',
        stack: 'Error stack trace',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
        json: async () => errorResponse,
      });

      // "Invalid token" triggers session expiry handling, which clears token and throws a different message
      await expect(apiRequest('/protected')).rejects.toThrow('Your session has expired. Please log in again.');
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiRequest('/endpoint')).rejects.toThrow('Network error');
    });

    it('intentionally exposes verbose error details (security vulnerability)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorResponse = {
        error: 'Server Error',
        message: 'Database connection failed',
        stack: 'Full stack trace here',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
        json: async () => errorResponse,
      });

      try {
        await apiRequest('/endpoint');
      } catch (error) {
        // Error should be logged with full details
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('api convenience methods', () => {
    it('api.get makes GET request', async () => {
      const mockData = { id: '1' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.get('/endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('api.post makes POST request with body', async () => {
      const mockData = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const body = { name: 'Test' };
      const result = await api.post('/endpoint', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('api.put makes PUT request with body', async () => {
      const mockData = { id: '1', updated: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const body = { name: 'Updated' };
      const result = await api.put('/endpoint', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('api.delete makes DELETE request', async () => {
      const mockData = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.delete('/endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(mockData);
    });
  });
});
