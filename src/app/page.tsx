'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuctionList from '../components/AuctionList';
import { isAuthenticated } from '../lib/auth';

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check authentication only on client to avoid hydration mismatch
    setMounted(true);
    setAuthenticated(isAuthenticated());
  }, []);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white rounded-2xl p-8 sm:p-12 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Auction Platform</h1>
              <p className="text-primary-200 text-lg mb-6">
                Welcome to the auction platform. Browse active auctions and place your bids!
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auctions?status=active"
                  className="inline-flex bg-white text-primary-700 hover:bg-primary-50 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  View Active Auctions
                </Link>
                <Link
                  href="/auctions"
                  className="inline-flex bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  Browse All
                </Link>
                <Link
                  href="/auctions?status=ended"
                  className="inline-flex bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  View Ended
                </Link>
              </div>
            </div>
            {mounted && authenticated && (
              <div className="shrink-0">
                <Link
                  href="/auctions/new"
                  className="inline-flex bg-accent-500 hover:bg-accent-600 text-white rounded-lg px-6 py-3 text-sm font-semibold transition-colors shadow-lg shadow-accent-500/25"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Auction
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Featured Auctions Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Active Auctions</h2>
            <Link href="/auctions?status=active" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              View all
              <span className="ml-1">&rarr;</span>
            </Link>
          </div>
          <AuctionList status="active" limit={12} />
        </div>
      </div>
    </main>
  );
}
