'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@design-system/utils';

interface PendingSalePhaseProps {
  auction: any;
  order: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function PendingSalePhase({ auction, order, isSeller, isBuyer, onUpdate }: PendingSalePhaseProps) {
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order?.tracking_url || '');
  const [shippingAddress, setShippingAddress] = useState(order?.shipping_address || '');
  const [updating, setUpdating] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number || '');
      setTrackingUrl(order.tracking_url || '');
      setShippingAddress(order.shipping_address || '');
    }
  }, [order]);

  const handleCreateOrder = async () => {
    if (!shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    try {
      setCreatingOrder(true);
      await api.createOrder({
        auction_id: auction.id,
        shipping_address: shippingAddress,
      });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleUpdateOrder = async (updates: any) => {
    if (!order) return;

    try {
      setUpdating(true);
      await api.updateOrder(order.id, updates);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!trackingNumber.trim() && !trackingUrl.trim()) {
      alert('Please enter a tracking number or tracking URL');
      return;
    }

    const updates: any = {
      tracking_number: trackingNumber,
      shipping_status: 'shipped',
      status: 'shipped',
    };

    if (trackingUrl.trim()) {
      updates.tracking_url = trackingUrl;
    }

    await handleUpdateOrder(updates);

    // Also update workflow state
    try {
      await api.updateWorkflowState(auction.id, 'shipping');
      onUpdate();
    } catch (err) {
      console.error('Failed to update workflow state:', err);
    }
  };

  if (isBuyer && !order) {
    return (
      <div className="bg-white rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Action Required: Complete Your Purchase</h3>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
          <p className="text-sm font-medium text-amber-800">
            The seller is waiting for you to complete payment and shipping details.
            Please provide your shipping address below to proceed with your purchase.
          </p>
        </div>

        <div className="space-y-3 mb-5">
          <h4 className="text-sm font-semibold text-slate-900">Order Summary</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Item:</span>
            <strong className="text-slate-900">{auction.title}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Winning Bid:</span>
            <strong className="text-primary-600">{formatCurrency(auction.current_bid)}</strong>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Shipping Address</label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Enter your full shipping address"
            rows={4}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
          />
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={creatingOrder || !shippingAddress.trim()}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
        >
          {creatingOrder ? 'Creating Order...' : 'Complete Purchase & Submit Shipping Details'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isBuyer && order && (
        <div className="bg-white rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Order Details</h3>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Order Status:</span>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
                {order.status || 'pending_payment'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total Amount:</span>
              <strong className="text-slate-900">{formatCurrency(order.total_amount)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Shipping Address:</span>
              <span className="text-slate-700 text-right max-w-[200px]">{order.shipping_address || 'Not provided'}</span>
            </div>
            {order.tracking_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tracking Number:</span>
                <span className="text-slate-700">{order.tracking_number}</span>
              </div>
            )}
          </div>
          {order.status === 'pending_payment' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-amber-800">
                Payment is pending. Please complete payment to proceed.
              </p>
            </div>
          )}
          <p className="text-xs text-slate-500">
            {order.status === 'pending_payment'
              ? 'Your order has been created. Please complete payment to proceed.'
              : 'Waiting for seller to add tracking information and mark as shipped.'}
          </p>
        </div>
      )}

      {isSeller && !order && (
        <div className="bg-white rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Waiting for Buyer</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-800">
              Waiting for the buyer to complete payment and provide shipping details.
              Once the buyer submits their information, you&apos;ll be able to prepare the shipment.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Winning Bid:</span>
              <strong className="text-primary-600">{formatCurrency(auction.current_bid)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Status:</span>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
                Pending Buyer Action
              </span>
            </div>
          </div>
        </div>
      )}

      {isSeller && order && (
        <div className="bg-white rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Prepare for Shipping</h3>
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Buyer:</span>
              <span className="text-slate-700">{order.buyer?.name || order.buyer?.email || `User ${order.buyer_id}`}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Shipping Address:</span>
              <span className="text-slate-700 text-right max-w-[200px]">{order.shipping_address || 'Not provided'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total Amount:</span>
              <strong className="text-slate-900">{formatCurrency(order.total_amount)}</strong>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tracking URL (optional)</label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://tracking.example.com/..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleMarkAsShipped}
            disabled={updating || (!trackingNumber.trim() && !trackingUrl.trim())}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
          >
            {updating ? 'Updating...' : 'Mark as Shipped'}
          </button>
        </div>
      )}
    </div>
  );
}
