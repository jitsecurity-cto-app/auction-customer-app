// TypeScript interfaces for API responses

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  password_hash?: string; // Intentionally exposed in API (security vulnerability)
  phone?: string;
  address?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_bid: number;
  end_time: string;
  status: 'active' | 'ended' | 'cancelled';
  workflow_state?: 'active' | 'pending_sale' | 'shipping' | 'complete';
  created_by: string;
  winner_id?: string;
  closed_at?: string;
  created_at: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  user?: User;
}

export interface Order {
  id: string;
  auction_id: string;
  buyer_id: string;
  seller_id: string;
  winning_bid_id?: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  shipping_address?: string;
  shipping_status: 'pending' | 'shipped' | 'delivered';
  tracking_number?: string;
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  auction?: Auction;
  buyer?: User;
  seller?: User;
}

export interface Dispute {
  id: string;
  auction_id: string;
  order_id?: string;
  filed_by: string;
  filed_by_role: 'seller' | 'buyer';
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution?: string;
  created_at: string;
  updated_at: string;
  auction?: Auction;
  order?: Order;
  filer?: User;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  stack?: string; // Intentionally exposed (security vulnerability)
}
