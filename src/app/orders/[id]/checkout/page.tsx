'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import StripeCheckout from '@/components/StripeCheckout';
import { formatCurrency } from '@design-system/utils';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOrder(orderId)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="max-w-lg mx-auto mt-12 text-center text-slate-500">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  if (order.status !== 'pending_payment') {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">This order has already been paid.</p>
          <button
            onClick={() => router.push(`/orders/${orderId}/`)}
            className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Order Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Checkout</h2>

        <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Order #{order.id}</span>
            <span className="text-slate-700">{order.auction?.title || 'Auction Item'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <strong className="text-slate-900">{formatCurrency(order.total_amount)}</strong>
          </div>
        </div>

        <StripeCheckout
          orderId={order.id}
          amount={order.total_amount}
          onSuccess={() => router.push(`/orders/${orderId}/`)}
        />
      </div>
    </div>
  );
}
