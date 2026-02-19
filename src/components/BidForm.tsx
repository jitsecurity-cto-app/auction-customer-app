'use client';

import { useState, FormEvent } from 'react';
import { api } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@design-system/utils';
import { trackEvent } from '@/lib/analytics';

interface BidFormProps {
  auctionId: string;
  currentBid: number;
  onBidPlaced?: () => void;
}

export default function BidForm({ auctionId, currentBid, onBidPlaced }: BidFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // No input validation (intentional vulnerability)
    const bidAmount = parseFloat(amount);

    if (isNaN(bidAmount)) {
      setError('Please enter a valid number');
      return;
    }

    if (bidAmount <= currentBid) {
      setError(`Bid must be greater than current bid of $${currentBid.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // No validation of auctionId or amount format (intentional vulnerability)
      await api.post(
        `/auctions/${auctionId}/bids`,
        { amount: bidAmount },
        true // requireAuth
      );

      setSuccess(true);
      setAmount('');

      if (onBidPlaced) {
        onBidPlaced();
      }

      trackEvent('Bid Placed', { auction_id: auctionId, amount: bidAmount });

      // Refresh page after a short delay to show updated bid
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to place bid';
      setError(errorMessage);
      console.error('Failed to place bid:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-slate-400 mx-auto mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <p className="text-sm text-slate-600 mb-3">
          Please <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">login</a> to place a bid
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-primary-600 px-5 py-3">
        <h3 className="text-white font-semibold">Place a Bid</h3>
      </div>
      <div className="p-5">
        <div className="mb-4">
          <span className="text-sm text-slate-500">Current bid</span>
          <div className="text-2xl font-bold text-primary-600">{formatCurrency(currentBid)}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={currentBid.toFixed(2)}
              className="w-full pl-8 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              // No input validation - accepts any format (intentional vulnerability)
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 mb-4 text-sm">
              Bid placed successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors"
          >
            {loading ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </form>
      </div>
    </div>
  );
}
