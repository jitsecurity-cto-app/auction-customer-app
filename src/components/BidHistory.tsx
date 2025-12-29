'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bid } from '../types';

interface BidHistoryProps {
  auctionId: string;
}

interface BidWithUser extends Bid {
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
        
        // No validation of auctionId (intentional vulnerability)
        const data = await api.get<BidWithUser[]>(`/auctions/${auctionId}/bids`);
        setBids(Array.isArray(data) ? data : []);
      } catch (err) {
        // Intentionally verbose error messages (security vulnerability)
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
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <p>Loading bid history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <p>No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Bid History</h3>
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                Bidder
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                Amount
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid, index) => (
              <tr 
                key={bid.id}
                style={{ 
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                  borderBottom: index < bids.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <td style={{ padding: '0.75rem' }}>
                  {bid.user?.name || bid.user?.email || `User ${bid.user_id}`}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                  ${bid.amount.toFixed(2)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280', fontSize: '0.875rem' }}>
                  {new Date(bid.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

