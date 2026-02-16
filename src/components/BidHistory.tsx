'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bid } from '../types';
import { formatCurrency, formatDateTime } from '@design-system/utils';

interface BidHistoryProps {
  auctionId: string;
}

interface BidWithUser {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export default function BidHistory({ auctionId }: BidHistoryProps) {
  const [bids, setBids] = useState<BidWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBids() {
      try {
        setLoading(true);
        setError(null);

        const data = await api.get<BidWithUser[]>(`/auctions/${auctionId}/bids`);
        setBids(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : 'Failed to load bids';
        setError(errorMessage);
        console.error('Failed to fetch bids:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBids();
  }, [auctionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-2 text-sm text-slate-500">Loading bid history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Error: {error}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-slate-300 mx-auto mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm text-slate-500">No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  // Sort bids by amount descending, then by time descending
  const sortedBids = [...bids].sort((a, b) => {
    if (b.amount !== a.amount) {
      return b.amount - a.amount;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const highestBid = sortedBids[0];

  return (
    <div>
      {/* Summary stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total Bids:</span>
          <span className="text-sm font-semibold text-slate-900">{bids.length}</span>
        </div>
        {highestBid && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Highest Bid:</span>
            <span className="text-sm font-semibold text-primary-600">{formatCurrency(highestBid.amount)}</span>
          </div>
        )}
      </div>

      {/* Bid table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Rank</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Bidder</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedBids.map((bid, index) => (
              <tr key={bid.id} className={index === 0 ? 'bg-primary-50' : 'hover:bg-slate-50'}>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${index === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                    #{index + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {bid.user?.name || bid.user?.email || `User ${bid.user_id}`}
                    </span>
                    {index === 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Highest
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(bid.amount || 0)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-slate-500">{formatDateTime(bid.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
