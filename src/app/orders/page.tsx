'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import { Order } from '@/types';
import Link from 'next/link';
import { formatCurrency } from '@design-system/utils';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [filter, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = getAuthUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // IDOR vulnerability: Can fetch orders for any user by modifying buyer_id/seller_id
      const params: any = {};
      if (filter === 'buyer') {
        params.buyer_id = user.id;
      } else if (filter === 'seller') {
        params.seller_id = user.id;
      }
      // No authorization check - can access any user's orders

      const response = await api.getOrders(params);
      setOrders(Array.isArray(response) ? response : (response.data || []));
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'shipped':
      case 'paid':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'pending_payment':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-slate-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm text-center">
          Error: {error}
        </div>
        <div className="text-center">
          <button
            onClick={fetchOrders}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <div className="flex gap-2">
          {(['all', 'buyer', 'seller'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All Orders' : f === 'buyer' ? 'As Buyer' : 'As Seller'}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 text-slate-300 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-sm text-slate-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <Link href={`/orders/${order.id}`} className="text-base font-semibold text-slate-900 hover:text-primary-600 transition-colors">
                    Order #{order.id}
                  </Link>
                  {order.auction && (
                    <Link href={`/auctions/${order.auction.id}`} className="block text-sm text-primary-600 hover:text-primary-700 mt-0.5">
                      {order.auction.title}
                    </Link>
                  )}
                </div>
                <span className={`shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <span className="text-xs text-slate-400">Total Amount</span>
                  <div className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Payment Status</span>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Shipping Status</span>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(order.shipping_status)}`}>
                      {order.shipping_status}
                    </span>
                  </div>
                </div>
                {order.tracking_number && (
                  <div>
                    <span className="text-xs text-slate-400">Tracking</span>
                    <div className="text-sm font-medium text-slate-700">{order.tracking_number}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Created: {new Date(order.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
