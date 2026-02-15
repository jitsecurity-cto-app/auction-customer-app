// API client with fetch wrapper
// Intentionally minimal error handling and no input validation (security vulnerabilities)

import { ApiResponse, ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage (intentionally insecure)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = localStorage.getItem('auth_token');
  // Trim whitespace to prevent "jwt malformed" errors
  return token ? token.trim() : null;
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available or if requireAuth is true (no validation)
  if (token || options.requireAuth) {
    const authToken = (token || getAuthToken())?.trim();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (options.requireAuth) {
      // If requireAuth is true but no token, throw a clear error
      throw new Error('Authentication required. Please log in.');
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
      let errorData: ApiError;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // If response is not JSON, read as text but don't expose raw content
          const text = await response.text();
          // Only use first 200 chars to avoid exposing large error pages
          const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
          errorData = {
            error: 'API Error',
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
          console.error('Non-JSON error response preview:', preview);
        }
      } catch (parseError) {
        errorData = {
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint,
      });

      // If token is malformed, clear it and ask user to log in again
      if (errorData.message?.toLowerCase().includes('jwt malformed') || 
          errorData.message?.toLowerCase().includes('invalid token')) {
        removeAuthToken();
        throw new Error('Your session has expired. Please log in again.');
      }

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
  async getAuctions(params?: { 
    status?: string; 
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number; 
    offset?: number 
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
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
    return apiRequest<any>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
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


  // Payment status endpoints
  async updatePaymentStatus(bidId: number, paymentStatus: string) {
    return apiRequest<any>(`/bids/${bidId}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
  },

  // Order endpoints
  async getOrders(params?: {
    buyer_id?: string;
    seller_id?: string;
    status?: string;
    payment_status?: string;
    shipping_status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.buyer_id) queryParams.append('buyer_id', params.buyer_id);
    if (params?.seller_id) queryParams.append('seller_id', params.seller_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.shipping_status) queryParams.append('shipping_status', params.shipping_status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return apiRequest<ApiResponse<any[]>>(endpoint);
  },

  async getOrderById(id: string) {
    return apiRequest<ApiResponse<any>>(`/orders/${id}`);
  },

  async createOrder(data: {
    auction_id: string;
    shipping_address: string;
  }) {
    return apiRequest<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  async updateOrder(id: string, data: Partial<any>) {
    return apiRequest<ApiResponse<any>>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Auction closure endpoints
  async closeAuction(id: string) {
    return apiRequest<any>(`/auctions/${id}/close`, {
      method: 'POST',
    });
  },

  async closeExpiredAuctions() {
    return apiRequest<any>('/auctions/close-expired', {
      method: 'POST',
    });
  },

  // Workflow endpoints
  async getAuctionsByWorkflow(params?: {
    workflow_state?: string;
    role?: 'seller' | 'buyer';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.workflow_state) queryParams.append('workflow_state', params.workflow_state);
    if (params?.role) queryParams.append('role', params.role);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/auctions/workflow?${queryString}` : '/auctions/workflow';
    try {
      const response = await apiRequest<any>(endpoint, { requireAuth: true });
      // Handle both array and object with data property
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (response && response.data) {
        return [response.data];
      }
      return [];
    } catch (error) {
      console.error('getAuctionsByWorkflow error:', error);
      throw error;
    }
  },

  async updateWorkflowState(auctionId: string, workflowState: string) {
    return apiRequest<any>(`/auctions/${auctionId}/workflow`, {
      method: 'PUT',
      body: JSON.stringify({ workflow_state: workflowState }),
      requireAuth: true,
    });
  },

  // Dispute endpoints
  async createDispute(data: {
    auction_id: string;
    order_id?: string;
    reason: string;
    filed_by_role: 'seller' | 'buyer';
  }) {
    return apiRequest<any>('/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  async getDisputes(params?: {
    auction_id?: string;
    order_id?: string;
    status?: string;
  }): Promise<import('../types').Dispute[]> {
    const queryParams = new URLSearchParams();
    if (params?.auction_id) queryParams.append('auction_id', params.auction_id);
    if (params?.order_id) queryParams.append('order_id', params.order_id);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/disputes?${queryString}` : '/disputes';
    return apiRequest<import('../types').Dispute[]>(endpoint);
  },
};

export default api;
