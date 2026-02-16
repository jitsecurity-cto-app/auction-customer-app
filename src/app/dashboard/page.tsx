'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { formatCurrency } from '@design-system/utils';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface AuctionWithOrder {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_bid: number;
  end_time: string;
  status: 'active' | 'ended' | 'cancelled';
  workflow_state?: WorkflowState;
  created_by: string;
  winner_id?: string;
  closed_at?: string;
  created_at: string;
  order?: any;
  bid_count: number;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [auctions, setAuctions] = useState<AuctionWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkflowState | 'all'>('all');
  const [role, setRole] = useState<'all' | 'seller' | 'buyer'>('all');
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const currentUser = getAuthUser();
    setUser(currentUser);

    if (!isAuthenticated() || !currentUser) {
      router.push('/login');
      return;
    }

    // Check URL params for role filter - only after mount to avoid hydration issues
    if (typeof window !== 'undefined') {
      const roleParam = searchParams.get('role');
      if (roleParam === 'seller' || roleParam === 'buyer') {
        setRole(roleParam);
      }
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!mounted || !user) return;

    fetchAuctions();
  }, [activeTab, role, user, mounted]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (activeTab !== 'all') {
        params.workflow_state = activeTab;
      }
      if (role !== 'all') {
        params.role = role;
      }

      // Convert 'all' to undefined for API
      if (params.role === 'all') {
        delete params.role;
      }

      // Use the new workflow endpoint
      const data = await api.getAuctionsByWorkflow(params);
      setAuctions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load auctions';
      setError(errorMessage);

      // If it's a database error about workflow_state, show helpful message
      if (errorMessage.includes('workflow_state') || errorMessage.includes('column')) {
        setError('Database migration required. Please run migration 003_workflow_states.sql to add the workflow_state column.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflowState = async (auctionId: string, newState: WorkflowState) => {
    try {
      await api.put(`/auctions/${auctionId}/workflow`, { workflow_state: newState }, true);
      fetchAuctions(); // Refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow state');
    }
  };

  const getWorkflowBadgeClasses = (state?: WorkflowState) => {
    switch (state) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending_sale':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'shipping':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'complete':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getWorkflowActions = (auction: AuctionWithOrder) => {
    // Return empty array during SSR or before user is loaded to prevent hydration mismatch
    if (typeof window === 'undefined' || !mounted || !user) return [];

    const actions: JSX.Element[] = [];
    const isSeller = auction.created_by === user.id;
    const isBuyer = auction.winner_id === user.id;

    if (isSeller) {
      // Seller actions
      if (auction.workflow_state === 'pending_sale') {
        actions.push(
          <button
            key="mark-shipping"
            onClick={() => updateWorkflowState(auction.id, 'shipping')}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Mark as Shipping
          </button>
        );
      } else if (auction.workflow_state === 'shipping') {
        actions.push(
          <button
            key="mark-complete"
            onClick={() => updateWorkflowState(auction.id, 'complete')}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Mark as Complete
          </button>
        );
      }
    }

    if (isBuyer) {
      // Buyer actions
      if (auction.workflow_state === 'pending_sale' && !auction.order) {
        actions.push(
          <Link key="create-order" href={`/auctions/${auction.id}`}>
            <span className="inline-flex bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
              Complete Purchase
            </span>
          </Link>
        );
      }
    }

    return actions;
  };

  // Only render content after mount to prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
          Error: {error}
        </div>
        <button
          onClick={fetchAuctions}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate grouped auctions only after mount check to prevent hydration mismatch
  const groupedAuctions = {
    active: auctions.filter(a => !a.workflow_state || a.workflow_state === 'active'),
    pending_sale: auctions.filter(a => a.workflow_state === 'pending_sale'),
    shipping: auctions.filter(a => a.workflow_state === 'shipping'),
    complete: auctions.filter(a => a.workflow_state === 'complete'),
  };

  // Find auctions where buyer needs to take action (pending_sale without order)
  const buyerActionNeeded = mounted && user
    ? auctions.filter(a =>
        a.workflow_state === 'pending_sale' &&
        a.winner_id === user.id &&
        !a.order
      )
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Activity</h1>
        <Link
          href="/auctions/new"
          className="inline-flex bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Auction
        </Link>
      </div>

      {/* Buyer Action Needed Banner */}
      {buyerActionNeeded.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-amber-600 mt-0.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <strong className="text-sm text-amber-900 block mb-0.5">Action Required: Complete Your Purchase</strong>
            <p className="text-sm text-amber-800">
              You have {buyerActionNeeded.length} {buyerActionNeeded.length === 1 ? 'auction' : 'auctions'} waiting for you to complete payment and shipping details.
              The seller is waiting for your action.
            </p>
          </div>
        </div>
      )}

      {/* Role Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role:</span>
        <div className="flex gap-2">
          {(['all', 'seller', 'buyer'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                role === r
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r === 'all' ? 'All' : r === 'seller' ? 'As Seller' : 'As Buyer'}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow State Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
        {[
          { value: 'all' as const, label: 'All', count: auctions.length },
          { value: 'active' as const, label: 'Active', count: groupedAuctions.active.length },
          { value: 'pending_sale' as const, label: 'Pending Sale', count: groupedAuctions.pending_sale.length },
          { value: 'shipping' as const, label: 'Shipping', count: groupedAuctions.shipping.length },
          { value: 'complete' as const, label: 'Complete', count: groupedAuctions.complete.length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Auction List */}
      <DashboardAuctionList
        auctions={activeTab === 'all' ? auctions : groupedAuctions[activeTab as WorkflowState] || auctions}
        getWorkflowActions={getWorkflowActions}
        getWorkflowBadgeClasses={getWorkflowBadgeClasses}
        userId={user?.id}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-slate-500 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

interface DashboardAuctionListProps {
  auctions: AuctionWithOrder[];
  getWorkflowActions: (auction: AuctionWithOrder) => JSX.Element[];
  getWorkflowBadgeClasses: (state?: WorkflowState) => string;
  userId?: string;
}

function DashboardAuctionList({ auctions, getWorkflowActions, getWorkflowBadgeClasses, userId }: DashboardAuctionListProps) {
  if (auctions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 text-slate-300 mx-auto mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.75 7.5h16.5" />
        </svg>
        <p className="text-sm text-slate-500">No auctions found in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {auctions.map((auction) => {
        const isSeller = userId && auction.created_by === userId;
        const isBuyer = userId && auction.winner_id === userId;
        const roleLabel = isSeller ? 'Seller' : isBuyer ? 'Buyer' : '';

        return (
          <div key={auction.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <Link href={`/auctions/${auction.id}`} className="text-base font-semibold text-slate-900 hover:text-primary-600 transition-colors">
                  {auction.title}
                </Link>
                {roleLabel && (
                  <span className="ml-2 inline-flex bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {roleLabel}
                  </span>
                )}
              </div>
              <span className={`shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getWorkflowBadgeClasses(auction.workflow_state)}`}>
                {auction.workflow_state ? auction.workflow_state.replace('_', ' ') : 'active'}
              </span>
            </div>

            <p className="text-sm text-slate-500 line-clamp-1 mb-3">
              {auction.description || 'No description'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
              <div>
                <span className="text-slate-400">Current Bid: </span>
                <span className="font-semibold text-slate-900">{formatCurrency(auction.current_bid)}</span>
              </div>
              <div>
                <span className="text-slate-400">Bids: </span>
                <span className="font-medium text-slate-700">{auction.bid_count}</span>
              </div>
              {auction.order && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Order: </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    auction.order.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {auction.order.status}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {(!auction.workflow_state || auction.workflow_state === 'active')
                  ? `Ends: ${new Date(auction.end_time).toLocaleString()}`
                  : `Ended: ${auction.closed_at ? new Date(auction.closed_at).toLocaleString() : 'N/A'}`
                }
              </span>
              <div className="flex items-center gap-2">
                {getWorkflowActions(auction)}
                <Link
                  href={`/auctions/${auction.id}`}
                  className="inline-flex bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
