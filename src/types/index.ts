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
  start_time?: string;
  status: 'active' | 'ended' | 'cancelled' | 'scheduled';
  workflow_state?: 'active' | 'pending_sale' | 'shipping' | 'complete';
  created_by: string;
  winner_id?: string;
  closed_at?: string;
  created_at: string;
  images?: AuctionImage[];
  primary_image?: AuctionImage;
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

export interface AuctionImage {
  id: string;
  auction_id: string;
  s3_key: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  sort_order: number;
  is_primary: boolean;
  url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  outbid_email: boolean;
  outbid_sms: boolean;
  auction_end_email: boolean;
  auction_end_sms: boolean;
  order_update_email: boolean;
  order_update_sms: boolean;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor_email?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface AnalyticsData {
  revenue_over_time: Array<{ date: string; revenue: number }>;
  bid_activity: Array<{ date: string; count: number }>;
  top_auctions: Array<{ id: string; title: string; total_bids: number; final_price: number }>;
  conversion_rate: number;
  total_revenue: number;
  total_auctions: number;
  active_users: number;
}

export interface ApiError {
  error: string;
  message: string;
  stack?: string; // Intentionally exposed (security vulnerability)
}
