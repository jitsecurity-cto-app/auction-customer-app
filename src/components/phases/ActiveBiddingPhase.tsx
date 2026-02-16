'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@design-system/utils';
import BidForm from '../BidForm';
import BidHistory from '../BidHistory';

interface ActiveBiddingPhaseProps {
  auction: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function ActiveBiddingPhase({ auction, isSeller, isBuyer, onUpdate }: ActiveBiddingPhaseProps) {
  const router = useRouter();
  const [closingAuction, setClosingAuction] = useState(false);

  const handleCloseAuction = async () => {
    if (!confirm('Are you sure you want to close this auction early? This will end bidding immediately.')) {
      return;
    }

    try {
      setClosingAuction(true);
      await api.closeAuction(auction.id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close auction');
    } finally {
      setClosingAuction(false);
    }
  };

  if (isSeller) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border-l-4 border-l-primary-500 border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Seller View - Active Bidding</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Current Highest Bid:</span>
              <span className="text-lg font-bold text-primary-600">{formatCurrency(auction.current_bid || auction.starting_price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Starting Price:</span>
              <span className="text-sm font-medium text-slate-700">{formatCurrency(auction.starting_price)}</span>
            </div>
          </div>

          <button
            onClick={handleCloseAuction}
            disabled={closingAuction}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            {closingAuction ? 'Closing...' : 'Stop Sale / Close Auction'}
          </button>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">All Bids</h4>
            <BidHistory auctionId={auction.id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border-l-4 border-l-primary-500 border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Place Your Bid</h3>
        <div className="space-y-2 mb-4">
          <p className="text-sm text-slate-600">
            Current Bid: <strong className="text-primary-600">{formatCurrency(auction.current_bid || auction.starting_price)}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Starting Price: {formatCurrency(auction.starting_price)}
          </p>
        </div>
        <BidForm
          auctionId={auction.id}
          currentBid={Number(auction.current_bid || auction.starting_price)}
          onBidPlaced={onUpdate}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Bid History</h4>
        <BidHistory auctionId={auction.id} />
      </div>
    </div>
  );
}
