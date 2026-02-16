'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuctionList from '../../components/AuctionList';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';

function AuctionsContent() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<'active' | 'ended' | 'cancelled' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const authenticated = isAuthenticated();

  useEffect(() => {
    // Get status from URL query parameter
    const statusParam = searchParams.get('status');
    if (statusParam === 'active' || statusParam === 'ended' || statusParam === 'cancelled') {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter(undefined);
    }
  }, [searchParams]);

  const hasActiveFilters = statusFilter !== undefined || search || minPrice !== undefined || maxPrice !== undefined;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Browse Auctions</h1>
            <p className="text-sm text-slate-500 mt-1">Discover unique items and place your bids</p>
          </div>
          {authenticated && (
            <Link
              href="/auctions/new"
              className="inline-flex bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Auction
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <SearchBar
              onSearch={(searchTerm, min, max) => {
                setSearch(searchTerm);
                setMinPrice(min);
                setMaxPrice(max);
              }}
              initialSearch={search}
              initialMinPrice={minPrice}
              initialMaxPrice={maxPrice}
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: undefined, label: 'All' },
                { value: 'active' as const, label: 'Active' },
                { value: 'ended' as const, label: 'Ended' },
                { value: 'cancelled' as const, label: 'Cancelled' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === item.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setStatusFilter(undefined);
                  setSearch('');
                  setMinPrice(undefined);
                  setMaxPrice(undefined);
                }}
                className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-slate-500">Active Filters:</span>
            {statusFilter && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                Status: {statusFilter}
              </span>
            )}
            {search && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                Search: {search}
              </span>
            )}
            {minPrice !== undefined && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                Min: ${minPrice.toFixed(2)}
              </span>
            )}
            {maxPrice !== undefined && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                Max: ${maxPrice.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Auction List */}
        <AuctionList
          status={statusFilter}
          search={search || undefined}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
      </div>
    </main>
  );
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-slate-500">Loading auctions...</p>
          </div>
        </div>
      </main>
    }>
      <AuctionsContent />
    </Suspense>
  );
}
