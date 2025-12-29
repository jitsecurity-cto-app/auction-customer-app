// API client with fetch wrapper
// Intentionally minimal error handling and no input validation (security vulnerabilities)

import { ApiResponse, ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage (intentionally insecure)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

// Set auth token in localStorage (intentionally insecure)
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('auth_token', token);
}

// Remove auth token from localStorage
export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('auth_token');
}

// Generic fetch wrapper with intentional security vulnerabilities
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { body?: unknown; requireAuth?: boolean } = {}
): Promise<T> {
  const token = getAuthToken();
  
  // Intentionally permissive headers (security vulnerability)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available or if requireAuth is true (no validation)
  if (token || options.requireAuth) {
    const authToken = token || getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  // Intentionally log requests with tokens (security vulnerability)
  if (typeof window !== 'undefined') {
    console.log('API Request:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : null,
    });
  }

  // Handle body - if it's already a string, use it; otherwise stringify
  let requestBody: string | undefined;
  if (options.body !== undefined) {
    requestBody = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: requestBody,
    });

    // Intentionally verbose error logging (security vulnerability)
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint,
      });

      throw new Error(errorData.message || errorData.error || 'API request failed');
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    // Intentionally verbose error logging (security vulnerability)
    console.error('API Request Error:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Generic API methods (for flexibility and testing)
export const api = {
  // Generic HTTP methods
  async get<T>(endpoint: string, requireAuth = false): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET', requireAuth });
  },

  async post<T>(endpoint: string, body: unknown, requireAuth = false): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body,
      requireAuth,
    });
  },

  async put<T>(endpoint: string, body: unknown, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body,
      requireAuth,
    });
  },

  async delete<T>(endpoint: string, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE', requireAuth });
  },

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    return apiRequest<ApiResponse<any>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async login(email: string, password: string) {
    return apiRequest<ApiResponse<any>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async verify() {
    return apiRequest<ApiResponse<any>>('/auth/verify', {
      method: 'POST',
    });
  },

  // Auction endpoints
  async getAuctions(params?: { status?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/auctions?${queryString}` : '/auctions';
    return apiRequest<ApiResponse<any[]>>(endpoint);
  },

  async getAuctionById(id: number) {
    return apiRequest<ApiResponse<any>>(`/auctions/${id}`);
  },

  async createAuction(data: {
    title: string;
    description: string;
    starting_price: number;
    end_time: string;
  }) {
    return apiRequest<ApiResponse<any>>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAuction(id: number, data: Partial<any>) {
    return apiRequest<ApiResponse<any>>(`/auctions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAuction(id: number) {
    return apiRequest<ApiResponse<any>>(`/auctions/${id}`, {
      method: 'DELETE',
    });
  },

  // Bid endpoints
  async getBidsByAuction(auctionId: number) {
    return apiRequest<ApiResponse<any[]>>(`/auctions/${auctionId}/bids`);
  },

  async createBid(auctionId: number, amount: number) {
    return apiRequest<ApiResponse<any>>(`/auctions/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // User endpoints
  async getUserById(id: string) {
    return apiRequest<any>(`/users/${id}`);
  },

  async updateUser(id: string, data: Partial<any>) {
    return apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export default api;
