// Authentication utilities (localStorage token management)
// Intentionally insecure - no token expiration check, weak storage (security vulnerability)

import { AuthResponse, User } from '../types';
import { api } from './api';
import { LoginRequest, RegisterRequest } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

/**
 * Store authentication token and user data
 * Intentionally stores in localStorage (XSS vulnerability)
 */
export function setAuth(token: string, user: User): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Trim token to prevent "jwt malformed" errors
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  // Trim whitespace to prevent "jwt malformed" errors
  return token ? token.trim() : null;
}

/**
 * Get stored user data
 */
export function getAuthUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userData = localStorage.getItem(USER_KEY);
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * Intentionally no token expiration check (security vulnerability)
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Register a new user
 * Intentionally no input validation (security vulnerability)
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  // Intentionally log credentials (security vulnerability)
  console.log('Registration attempt:', {
    email: data.email,
    passwordLength: data.password.length,
    name: data.name,
  });

  const response = await api.post<AuthResponse>('/auth/register', data);
  
  // Store token and user data
  setAuth(response.token, response.user);
  
  return response;
}

/**
 * Login with email and password
 * Intentionally no input validation (security vulnerability)
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  // Intentionally log credentials (security vulnerability)
  console.log('Login attempt:', {
    email: data.email,
    passwordLength: data.password.length,
  });

  const response = await api.post<AuthResponse>('/auth/login', data);
  
  // Store token and user data
  setAuth(response.token, response.user);
  
  // Intentionally log token (security vulnerability)
  console.log('Login successful, token stored:', response.token.substring(0, 20) + '...');
  
  return response;
}

/**
 * Logout current user
 */
export function logout(): void {
  clearAuth();
}

/**
 * Verify current token (optional - not used in basic flow)
 */
export async function verifyToken(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await (api as any).post(
      '/auth/verify',
      {},
      true
    ) as { valid: boolean; user: User };
    return response.valid ? response.user : null;
  } catch {
    return null;
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  return verifyToken();
}

/**
 * Get token (intentionally exposed - security vulnerability)
 */
export function getToken(): string | null {
  return getAuthToken();
}
