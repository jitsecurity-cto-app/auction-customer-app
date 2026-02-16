'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction } from '../types';
import AuctionCard from './AuctionCard';

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

        // For "active" and "ended" filters, we need client-side filtering
        // because the backend only checks the database status column.
        // Auctions that expired by time but weren't formally closed still
        // have status='active' in the database, so we fetch all and filter.
        const needsClientSideFilter = status === 'active' || status === 'ended';

        // Use API client method with search and price filters
        // No input validation (intentional vulnerability)
        const response = await api.getAuctions({
          status: needsClientSideFilter ? undefined : status,
          search,
          minPrice,
          maxPrice,
          limit: needsClientSideFilter ? undefined : limit,
        });

        // Handle both wrapped and unwrapped responses
        const data = Array.isArray(response) ? response : (response as any)?.data || [];
        let auctionData: Auction[] = Array.isArray(data) ? data : [];

        // Client-side filtering for time-based status
        if (status === 'ended') {
          const now = new Date();
          auctionData = auctionData.filter(
            (auction) => auction.status === 'ended' || new Date(auction.end_time) < now
          );
        } else if (status === 'active') {
          const now = new Date();
          auctionData = auctionData.filter(
            (auction) => auction.status === 'active' && new Date(auction.end_time) > now
          );
        }

        // Apply limit after client-side filtering
        if (needsClientSideFilter && limit) {
          auctionData = auctionData.slice(0, limit);
        }

        setAuctions(auctionData);
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
      <div className="flex flex-col items-center justify-center py-16">
        <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-slate-500">Loading auctions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 max-w-md text-center">
          <p className="text-sm font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 text-slate-300 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.75 7.5h16.5" />
        </svg>
        <p className="text-sm text-slate-500">No auctions found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}
