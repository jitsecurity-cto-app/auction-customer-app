'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { isAuthenticated } from '../../../lib/auth';
import Link from 'next/link';

export default function CreateAuctionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    end_time: '',
  });

  // Redirect if not authenticated
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // No input validation (intentional vulnerability)
    const startingPrice = parseFloat(formData.starting_price);

    if (isNaN(startingPrice) || startingPrice <= 0) {
      setError('Starting price must be a positive number');
      return;
    }

    // No validation of end_time format (intentional vulnerability)
    const endTime = new Date(formData.end_time);
    if (isNaN(endTime.getTime())) {
      setError('Invalid end time format');
      return;
    }

    if (endTime <= new Date()) {
      setError('End time must be in the future');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // No input sanitization (XSS vulnerability)
      const auctionData = {
        title: formData.title,
        description: formData.description,
        starting_price: startingPrice,
        end_time: endTime.toISOString(),
      };

      // Intentionally log auction data (security vulnerability)
      console.log('Creating auction:', auctionData);

      const result = await api.createAuction(auctionData);

      // API returns auction directly
      // Redirect to the new auction page
      if (result && result.id) {
        router.push(`/auctions/${result.id}`);
      } else {
        router.push('/auctions');
      }
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to create auction';
      setError(errorMessage);
      console.error('Failed to create auction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/auctions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Auctions
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create New Auction</h1>
          <p className="text-sm text-slate-500 mt-1">Fill in the details below to create a new auction listing.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500" />
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Auction Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Vintage Camera Collection"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  // No input validation - accepts any format (intentional vulnerability)
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  placeholder="Describe your auction item in detail..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  // No input sanitization - XSS vulnerability (intentional)
                />
                <p className="mt-1 text-xs text-slate-400">Note: Description will be rendered without sanitization (XSS vulnerability)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="starting_price" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Starting Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input
                      id="starting_price"
                      type="text"
                      value={formData.starting_price}
                      onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                      required
                      placeholder="0.00"
                      className="w-full pl-8 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      // No input validation - accepts any format (intentional vulnerability)
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-slate-700 mb-1.5">
                    End Time
                  </label>
                  <input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    // No validation of date format (intentional vulnerability)
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm" role="alert">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Auction'}
                </button>
                <Link
                  href="/auctions"
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
