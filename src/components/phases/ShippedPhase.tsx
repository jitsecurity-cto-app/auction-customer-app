'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@design-system/utils';
import { trackEvent } from '@/lib/analytics';

interface ShippedPhaseProps {
  auction: any;
  order: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function ShippedPhase({ auction, order, isSeller, isBuyer, onUpdate }: ShippedPhaseProps) {
  const [confirming, setConfirming] = useState(false);
  const [daysUntilAutoComplete, setDaysUntilAutoComplete] = useState<number | null>(null);

  useEffect(() => {
    if (order?.shipped_at) {
      const shippedDate = new Date(order.shipped_at);
      const daysSince = Math.floor((Date.now() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - daysSince);
      setDaysUntilAutoComplete(daysRemaining);
    }
  }, [order]);

  const handleConfirmReceipt = async () => {
    if (!confirm('Confirm that you have received the item?')) {
      return;
    }

    try {
      setConfirming(true);
      await api.updateOrder(order.id, {
        shipping_status: 'delivered',
        status: 'completed',
      });

      // Update workflow state
      await api.updateWorkflowState(auction.id, 'complete');
      trackEvent('Order Completed', { order_id: order.id });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm receipt');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-l-4 border-l-blue-500 border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Item Shipped</h3>

      <div className="space-y-3 mb-5">
        {order?.tracking_number && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tracking Number:</span>
            <strong className="text-slate-900">{order.tracking_number}</strong>
          </div>
        )}
        {order?.tracking_url && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tracking Link:</span>
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Track Package
            </a>
          </div>
        )}
        {order?.shipped_at && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Shipped On:</span>
            <span className="text-slate-700">{new Date(order.shipped_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {isBuyer && (
        <div>
          <p className="text-sm text-slate-600 mb-4">
            {daysUntilAutoComplete !== null && daysUntilAutoComplete > 0
              ? `Please confirm receipt. Order will auto-complete in ${daysUntilAutoComplete} days if not confirmed.`
              : 'Please confirm that you have received the item.'}
          </p>
          <button
            onClick={handleConfirmReceipt}
            disabled={confirming}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
          >
            {confirming ? 'Confirming...' : 'Confirm Receipt'}
          </button>
        </div>
      )}

      {isSeller && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Waiting for buyer to confirm receipt. Order will automatically complete after 30 days if not confirmed.
          </p>
        </div>
      )}
    </div>
  );
}
