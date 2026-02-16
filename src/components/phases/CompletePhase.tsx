'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@design-system/utils';

interface CompletePhaseProps {
  auction: any;
  order: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function CompletePhase({ auction, order, isSeller, isBuyer, onUpdate }: CompletePhaseProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [filingDispute, setFilingDispute] = useState(false);

  const handleFileDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please enter a reason for the dispute');
      return;
    }

    if (!confirm('File a dispute? This will be reviewed by our support team.')) {
      return;
    }

    try {
      setFilingDispute(true);
      await api.createDispute({
        auction_id: auction.id,
        order_id: order.id,
        reason: disputeReason,
        filed_by_role: isSeller ? 'seller' : 'buyer',
      });

      alert('Dispute filed successfully. Our support team will review it shortly.');
      setDisputeReason('');
      onUpdate();
    } catch (err) {
      // If endpoint doesn't exist yet, show a message
      if (err instanceof Error && err.message.includes('404')) {
        alert('Dispute filing will be available soon. For now, please contact support.');
      } else {
        alert(err instanceof Error ? err.message : 'Failed to file dispute');
      }
    } finally {
      setFilingDispute(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Complete</h3>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium">
            Completed
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Final Amount:</span>
          <strong className="text-slate-900">{formatCurrency(order?.total_amount || auction.current_bid)}</strong>
        </div>
        {order?.completed_at && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Completed On:</span>
            <span className="text-slate-700">{new Date(order.completed_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">File a Dispute</h4>
        <p className="text-xs text-slate-500 mb-4">
          If you have any issues with this transaction, you can file a dispute.
          Our support team will review it and contact you.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Dispute Reason</label>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
          />
        </div>
        <button
          onClick={handleFileDispute}
          disabled={filingDispute || !disputeReason.trim()}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
        >
          {filingDispute ? 'Filing Dispute...' : 'File Dispute'}
        </button>
      </div>
    </div>
  );
}
