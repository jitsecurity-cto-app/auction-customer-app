'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction } from '../types';
import BidForm from './BidForm';
import BidHistory from './BidHistory';

interface AuctionDetailProps {
  auctionId: string;
}

interface AuctionWithDetails extends Auction {
  bids?: Array<{
    id: string;
    user_id: string;
    amount: number;
    created_at: string;
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }>;
  creator?: {
    id: string;
    email: string;
    name: string;
  };
}

export default function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const [auction, setAuction] = useState<AuctionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // No validation of auctionId (intentional vulnerability)
      const data = await api.get<AuctionWithDetails>(`/auctions/${auctionId}`);
      setAuction(data);
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load auction';
      setError(errorMessage);
      console.error('Failed to fetch auction:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuction();
  }, [auctionId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading auction details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Auction not found.</p>
      </div>
    );
  }

  const endDate = new Date(auction.end_time);
  const isEnded = auction.status === 'ended' || endDate < new Date();
  const timeRemaining = isEnded 
    ? 'Ended' 
    : `${Math.floor((endDate.getTime() - Date.now()) / (1000 * 60 * 60))}h remaining`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          {auction.title}
        </h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '2rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Current Bid
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              ${auction.current_bid.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Starting Price
            </div>
            <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>
              ${auction.starting_price.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Status
            </div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: isEnded ? '#ef4444' : '#10b981'
            }}>
              {auction.status.toUpperCase()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Time Remaining
            </div>
            <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>
              {timeRemaining}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Description</h2>
          <div 
            style={{ 
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              lineHeight: '1.6',
              color: '#374151'
            }}
            // XSS vulnerability: using dangerouslySetInnerHTML without sanitization
            dangerouslySetInnerHTML={{ __html: auction.description }}
          />
        </div>

        {auction.creator && (
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            Created by: {auction.creator.name || auction.creator.email}
          </div>
        )}
      </div>

      {auction.status === 'active' && !isEnded && (
        <div style={{ marginBottom: '2rem' }}>
          <BidForm 
            auctionId={auctionId} 
            currentBid={auction.current_bid}
            onBidPlaced={fetchAuction}
          />
        </div>
      )}

      <BidHistory auctionId={auctionId} />
    </div>
  );
}

