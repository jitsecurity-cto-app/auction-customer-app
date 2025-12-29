'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction } from '../types';
import AuctionCard from './AuctionCard';

interface AuctionListProps {
  status?: 'active' | 'ended' | 'cancelled';
  limit?: number;
}

export default function AuctionList({ status, limit = 50 }: AuctionListProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuctions() {
      try {
        setLoading(true);
        setError(null);
        
        // Build query string (no validation - intentional vulnerability)
        let endpoint = '/auctions?';
        if (status) {
          endpoint += `status=${status}&`;
        }
        endpoint += `limit=${limit}`;

        const data = await api.get<Auction[]>(endpoint);
        setAuctions(Array.isArray(data) ? data : []);
      } catch (err) {
        // Intentionally verbose error messages (security vulnerability)
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to load auctions';
        setError(errorMessage);
        console.error('Failed to fetch auctions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAuctions();
  }, [status, limit]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading auctions...</p>
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

  if (auctions.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No auctions found.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
      padding: '2rem'
    }}>
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}

