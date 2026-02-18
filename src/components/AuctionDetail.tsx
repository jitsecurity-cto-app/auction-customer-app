'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useResolvedParam } from '../hooks/useResolvedParam';
import { api } from '../lib/api';
import { Auction, Dispute } from '../types';
import { getAuthUser } from '../lib/auth';
import { formatCurrency, formatTimeRemaining } from '@design-system/utils';
import WorkflowVisualization from './WorkflowVisualization';
import ActiveBiddingPhase from './phases/ActiveBiddingPhase';
import PendingSalePhase from './phases/PendingSalePhase';
import ShippedPhase from './phases/ShippedPhase';
import CompletePhase from './phases/CompletePhase';
import BidHistory from './BidHistory';
import ImageGallery from './ImageGallery';

interface AuctionDetailProps {
  auctionId: string;
}

interface AuctionWithDetails extends Auction {
  workflow_state?: 'active' | 'pending_sale' | 'shipping' | 'complete';
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
  order?: any;
}

export default function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const resolvedId = useResolvedParam(auctionId);

  const [auction, setAuction] = useState<AuctionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<AuctionWithDetails>(`/auctions/${resolvedId}`);
      setAuction(data);
    } catch (err) {
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resolvedId) {
      fetchAuction();
    }
  }, [resolvedId]);

  const fetchDisputes = async () => {
    try {
      // Fetch disputes for this auction
      // No authorization check - intentional vulnerability (can see all disputes)
      const auctionDisputes = await api.getDisputes({ auction_id: resolvedId });
      // Only show active disputes (open or in_review)
      const activeDisputes = auctionDisputes.filter(d => d.status === 'open' || d.status === 'in_review');
      setDisputes(activeDisputes);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      // Silently fail - disputes are optional
    }
  };

  useEffect(() => {
    if (resolvedId && resolvedId !== 'placeholder') {
      fetchDisputes();
    }
  }, [resolvedId]);

  useEffect(() => {
    if (!auction || !mounted) return;

    const endDate = new Date(auction.end_time);
    const ended = auction.status === 'ended' || endDate < new Date();
    setIsEnded(ended);

    if (ended) {
      setTimeRemaining('Ended');
    } else {
      const updateTimeRemaining = () => {
        setTimeRemaining(formatTimeRemaining(endDate));
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(interval);
    }
  }, [auction, mounted]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="animate-spin h-10 w-10 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500">Loading auction details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Auction</h2>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button onClick={fetchAuction} className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Auction Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">The auction you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/auctions" className="inline-flex bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              Browse Auctions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const user = getAuthUser();
  const isSeller = user && auction.created_by === user.id;
  const isBuyer = user && auction.winner_id === user.id;
  const workflowState = auction.workflow_state || (auction.status === 'active' ? 'active' : 'pending_sale');

  const getStatusBadgeClasses = () => {
    if (isEnded) return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  const getWorkflowBadgeClasses = () => {
    switch (workflowState) {
      case 'pending_sale': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'shipping': return 'bg-blue-50 text-blue-700 border border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="space-y-6 mb-8">
          {/* Back link */}
          <Link href="/auctions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Auctions
          </Link>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{auction.title}</h1>
              {auction.creator && (
                <p className="text-sm text-slate-500">
                  <span className="text-slate-400">Seller:</span>{' '}
                  <span className="font-medium text-slate-600">{auction.creator.name || auction.creator.email}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClasses()}`}>
                {auction.status}
              </span>
              {workflowState && workflowState !== 'active' && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getWorkflowBadgeClasses()}`}>
                  {workflowState.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Dispute Notice */}
          {disputes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-amber-600 mt-0.5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div>
                  <span className="inline-flex bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-3 py-0.5 text-xs font-medium mb-2">
                    Dispute Pending
                  </span>
                  <p className="text-sm text-amber-800">
                    {disputes.length === 1
                      ? 'A dispute has been opened for this auction and is currently pending review.'
                      : `${disputes.length} disputes have been opened for this auction and are currently pending review.`
                    }
                  </p>
                  {disputes.length === 1 && disputes[0].reason && (
                    <p className="text-sm text-amber-700 mt-1">
                      <strong>Reason:</strong> {disputes[0].reason}
                    </p>
                  )}
                  <div className="mt-3">
                    <Link
                      href={`/profile?id=${getAuthUser()?.id || ''}`}
                      className="inline-flex bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      View Disputes in Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Stats */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-200">
              <div className="px-6 py-5">
                <div className="text-xs text-slate-500 mb-1">Current Bid</div>
                <div className="text-2xl font-bold text-primary-600">
                  {formatCurrency(auction.current_bid || auction.starting_price)}
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs text-slate-500 mb-1">Starting Price</div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatCurrency(auction.starting_price)}
                </div>
              </div>
              {!isEnded && (
                <div className="px-6 py-5 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-500 mb-1">Time Remaining</div>
                  <div className="text-lg font-semibold text-slate-900">{timeRemaining}</div>
                </div>
              )}
              {isEnded && auction.closed_at && (
                <div className="px-6 py-5 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-500 mb-1">Ended</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {new Date(auction.closed_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Visualization */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Auction Progress</h2>
            <WorkflowVisualization currentState={workflowState} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Description + Bid History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Photos</h2>
              <ImageGallery auctionId={resolvedId} editable={!!isSeller} />
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
              {/* Intentionally uses dangerouslySetInnerHTML (XSS vulnerability) */}
              <div
                className="prose prose-slate max-w-none text-sm text-slate-600"
                dangerouslySetInnerHTML={{ __html: auction.description }}
              />
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Bid History</h2>
              <BidHistory
                auctionId={resolvedId}
                onNewBid={(bid) => {
                  // Update the displayed current bid in real-time
                  if (bid.amount && auction) {
                    setAuction({ ...auction, current_bid: bid.amount });
                  }
                }}
              />
            </div>
          </div>

          {/* Right Column - Phase Actions */}
          <div className="space-y-6">
            {mounted && (
              <>
                {workflowState === 'active' && (
                  <ActiveBiddingPhase
                    auction={auction}
                    isSeller={!!isSeller}
                    isBuyer={!!isBuyer}
                    onUpdate={fetchAuction}
                  />
                )}

                {workflowState === 'pending_sale' && (
                  <PendingSalePhase
                    auction={auction}
                    order={auction.order}
                    isSeller={!!isSeller}
                    isBuyer={!!isBuyer}
                    onUpdate={fetchAuction}
                  />
                )}

                {workflowState === 'shipping' && (
                  <ShippedPhase
                    auction={auction}
                    order={auction.order}
                    isSeller={!!isSeller}
                    isBuyer={!!isBuyer}
                    onUpdate={fetchAuction}
                  />
                )}

                {workflowState === 'complete' && (
                  <CompletePhase
                    auction={auction}
                    order={auction.order}
                    isSeller={!!isSeller}
                    isBuyer={!!isBuyer}
                    onUpdate={fetchAuction}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
