import {
  setAuth,
  getAuthToken,
  getAuthUser,
  isAuthenticated,
  clearAuth,
  register,
  login,
  logout,
  verifyToken,
} from '../../../src/lib/auth';
import { User, AuthResponse } from '../../../src/types';
import * as apiModule from '../../../src/lib/api';

// Mock API module
jest.mock('../../../src/lib/api');

describe('Auth Utilities', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('stores and retrieves auth token', () => {
      const token = 'test-token-123';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      expect(getAuthToken()).toBe(token);
      expect(getAuthUser()).toEqual(user);
    });

    it('returns null when no token is stored', () => {
      expect(getAuthToken()).toBeNull();
      expect(getAuthUser()).toBeNull();
    });

    it('checks if user is authenticated', () => {
      expect(isAuthenticated()).toBe(false);

      const token = 'test-token';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);
      expect(isAuthenticated()).toBe(true);
    });

    it('clears authentication data', () => {
      const token = 'test-token';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);
      expect(isAuthenticated()).toBe(true);

      clearAuth();
      expect(isAuthenticated()).toBe(false);
      expect(getAuthToken()).toBeNull();
      expect(getAuthUser()).toBeNull();
    });
  });

  describe('Registration', () => {
    it('registers user and stores token', async () => {
      const mockResponse: AuthResponse = {
        token: 'new-token',
        user: {
          id: '2',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user',
          created_at: new Date().toISOString(),
        },
      };

      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const result = await register(registerData);

      expect(apiModule.api.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData
      );
      expect(result).toEqual(mockResponse);
      expect(getAuthToken()).toBe('new-token');
      expect(getAuthUser()).toEqual(mockResponse.user);
    });

    it('handles registration errors', async () => {
      const error = new Error('User already exists');
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('Login', () => {
    it('logs in user and stores token', async () => {
      const mockResponse: AuthResponse = {
        token: 'login-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          created_at: new Date().toISOString(),
        },
      };

      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await login(loginData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse);
      expect(getAuthToken()).toBe('login-token');
      expect(getAuthUser()).toEqual(mockResponse.user);
    });

    it('handles login errors', async () => {
      const error = new Error('Invalid credentials');
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Logout', () => {
    it('clears authentication data', () => {
      const token = 'test-token';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);
      expect(isAuthenticated()).toBe(true);

      logout();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Token Verification', () => {
    it('verifies valid token', async () => {
      const token = 'valid-token';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      const mockResponse = {
        valid: true,
        user,
      };

      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await verifyToken();

      expect(apiModule.api.post).toHaveBeenCalledWith(
        '/auth/verify',
        {},
        true
      );
      expect(result).toEqual(user);
    });

    it('returns null for invalid token', async () => {
      const error = new Error('Invalid token');
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(error);

      const result = await verifyToken();

      expect(result).toBeNull();
    });

    it('returns null when no token is stored', async () => {
      clearAuth();
      const result = await verifyToken();
      expect(result).toBeNull();
      expect(apiModule.api.post).not.toHaveBeenCalled();
    });
  });

  describe('Security Vulnerabilities (Intentional)', () => {
    it('stores token in localStorage (XSS vulnerability)', () => {
      const token = 'sensitive-token';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      // Token is stored in localStorage (vulnerable to XSS)
      expect(localStorage.getItem('auth_token')).toBe(token);
    });

    it('does not check token expiration (intentional vulnerability)', () => {
      const token = 'expired-token';
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      // isAuthenticated only checks if token exists, not if it's expired
      expect(isAuthenticated()).toBe(true);
    });
  });
});
