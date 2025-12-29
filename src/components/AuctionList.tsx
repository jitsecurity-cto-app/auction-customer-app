'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction } from '../types';
import AuctionCard from './AuctionCard';
import styles from './AuctionList.module.css';

interface AuctionListProps {
  status?: 'active' | 'ended' | 'cancelled';
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export default function AuctionList({ 
  status, 
  limit = 50,
  search,
  minPrice,
  maxPrice
}: AuctionListProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuctions() {
      try {
        setLoading(true);
        setError(null);
        
        // Use API client method with search and price filters
        // No input validation (intentional vulnerability)
        const response = await api.getAuctions({
          status,
          search,
          minPrice,
          maxPrice,
          limit,
        });
        
        // Handle both wrapped and unwrapped responses
        const data = Array.isArray(response) ? response : (response as any)?.data || [];
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
  }, [status, limit, search, minPrice, maxPrice]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading auctions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No auctions found.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}

