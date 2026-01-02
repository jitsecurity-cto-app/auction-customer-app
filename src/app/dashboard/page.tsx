'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button, Card, Badge } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import styles from './page.module.css';

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

  const getWorkflowBadgeVariant = (state: WorkflowState) => {
    switch (state) {
      case 'active':
        return 'success';
      case 'pending_sale':
        return 'warning';
      case 'shipping':
        return 'info';
      case 'complete':
        return 'default';
      default:
        return 'default';
    }
  };

  const getWorkflowActions = (auction: AuctionWithOrder) => {
    // Return empty array during SSR or before user is loaded to prevent hydration mismatch
    if (typeof window === 'undefined' || !mounted || !user) return [];
    
    const actions = [];
    const isSeller = auction.created_by === user.id;
    const isBuyer = auction.winner_id === user.id;

    if (isSeller) {
      // Seller actions
      if (auction.workflow_state === 'pending_sale') {
        actions.push(
          <Button
            key="mark-shipping"
            variant="primary"
            size="sm"
            onClick={() => updateWorkflowState(auction.id, 'shipping')}
          >
            Mark as Shipping
          </Button>
        );
      } else if (auction.workflow_state === 'shipping') {
        actions.push(
          <Button
            key="mark-complete"
            variant="primary"
            size="sm"
            onClick={() => updateWorkflowState(auction.id, 'complete')}
          >
            Mark as Complete
          </Button>
        );
      }
    }

    if (isBuyer) {
      // Buyer actions
      if (auction.workflow_state === 'pending_sale' && !auction.order) {
        actions.push(
          <Link key="create-order" href={`/auctions/${auction.id}`}>
            <Button variant="primary" size="sm">
              Complete Purchase
            </Button>
          </Link>
        );
      }
    }

    return actions;
  };

  // Only render content after mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.error}>Error: {error}</p>
        <Button variant="primary" onClick={fetchAuctions}>
          Retry
        </Button>
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Activity</h1>
        <div className={styles.actions}>
          <Link href="/auctions/new">
            <Button variant="primary">Create Auction</Button>
          </Link>
        </div>
      </div>

      {buyerActionNeeded.length > 0 && (
        <div style={{
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#856404', display: 'block', marginBottom: '4px' }}>
              Action Required: Complete Your Purchase
            </strong>
            <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
              You have {buyerActionNeeded.length} {buyerActionNeeded.length === 1 ? 'auction' : 'auctions'} waiting for you to complete payment and shipping details. 
              The seller is waiting for your action.
            </p>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.roleFilter}>
          <Button
            variant={role === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRole('all')}
          >
            All
          </Button>
          <Button
            variant={role === 'seller' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRole('seller')}
          >
            As Seller
          </Button>
          <Button
            variant={role === 'buyer' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRole('buyer')}
          >
            As Buyer
          </Button>
        </div>
      </div>

      <div className={styles.workflowFilters}>
        <Button
          variant={activeTab === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          All ({auctions.length})
        </Button>
        <Button
          variant={activeTab === 'active' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('active')}
        >
          Active ({groupedAuctions.active.length})
        </Button>
        <Button
          variant={activeTab === 'pending_sale' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('pending_sale')}
        >
          Pending Sale ({groupedAuctions.pending_sale.length})
        </Button>
        <Button
          variant={activeTab === 'shipping' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('shipping')}
        >
          Shipping ({groupedAuctions.shipping.length})
        </Button>
        <Button
          variant={activeTab === 'complete' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('complete')}
        >
          Complete ({groupedAuctions.complete.length})
        </Button>
      </div>

      <div className={styles.content}>
        {activeTab === 'all' && (
          <AuctionList auctions={auctions} getWorkflowActions={getWorkflowActions} getWorkflowBadgeVariant={getWorkflowBadgeVariant} userId={user?.id} />
        )}
        {activeTab === 'active' && (
          <AuctionList auctions={groupedAuctions.active} getWorkflowActions={getWorkflowActions} getWorkflowBadgeVariant={getWorkflowBadgeVariant} userId={user?.id} />
        )}
        {activeTab === 'pending_sale' && (
          <AuctionList auctions={groupedAuctions.pending_sale} getWorkflowActions={getWorkflowActions} getWorkflowBadgeVariant={getWorkflowBadgeVariant} userId={user?.id} />
        )}
        {activeTab === 'shipping' && (
          <AuctionList auctions={groupedAuctions.shipping} getWorkflowActions={getWorkflowActions} getWorkflowBadgeVariant={getWorkflowBadgeVariant} userId={user?.id} />
        )}
        {activeTab === 'complete' && (
          <AuctionList auctions={groupedAuctions.complete} getWorkflowActions={getWorkflowActions} getWorkflowBadgeVariant={getWorkflowBadgeVariant} userId={user?.id} />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className={styles.container}><p>Loading...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}

interface AuctionListProps {
  auctions: AuctionWithOrder[];
  getWorkflowActions: (auction: AuctionWithOrder) => JSX.Element[];
  getWorkflowBadgeVariant: (state: WorkflowState) => 'success' | 'warning' | 'info' | 'default' | 'error';
  userId?: string;
}

function AuctionList({ auctions, getWorkflowActions, getWorkflowBadgeVariant, userId }: AuctionListProps) {
  if (auctions.length === 0) {
    return (
      <Card variant="outlined" padding="md">
        <p>No auctions found in this category.</p>
      </Card>
    );
  }

  return (
    <div className={styles.auctionsList}>
      {auctions.map((auction) => {
        const isSeller = userId && auction.created_by === userId;
        const isBuyer = userId && auction.winner_id === userId;
        const role = isSeller ? 'Seller' : isBuyer ? 'Buyer' : '';

        return (
          <Card key={auction.id} variant="outlined" padding="md" className={styles.auctionCard}>
            <div className={styles.auctionHeader}>
              <div>
                <h3>
                  <Link href={`/auctions/${auction.id}`}>
                    {auction.title}
                  </Link>
                </h3>
                {role && (
                  <Badge variant="default" size="sm" className={styles.roleBadge}>
                    {role}
                  </Badge>
                )}
              </div>
              <Badge variant={getWorkflowBadgeVariant(auction.workflow_state)} size="md">
                {auction.workflow_state ? auction.workflow_state.replace('_', ' ') : 'active'}
              </Badge>
            </div>

            <p className={styles.auctionDescription}>
              {auction.description || 'No description'}
            </p>

            <div className={styles.auctionMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Current Bid:</span>
                <span className={styles.metaValue}>{formatCurrency(auction.current_bid)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Bids:</span>
                <span className={styles.metaValue}>{auction.bid_count}</span>
              </div>
              {auction.order && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order Status:</span>
                  <Badge variant={auction.order.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {auction.order.status}
                  </Badge>
                </div>
              )}
            </div>

            <div className={styles.auctionFooter}>
              <span className={styles.endTime}>
                {(!auction.workflow_state || auction.workflow_state === 'active') 
                  ? `Ends: ${new Date(auction.end_time).toLocaleString()}`
                  : `Ended: ${auction.closed_at ? new Date(auction.closed_at).toLocaleString() : 'N/A'}`
                }
              </span>
              <div className={styles.actions}>
                {getWorkflowActions(auction)}
                <Link href={`/auctions/${auction.id}`}>
                  <Button variant="secondary" size="sm">View Details</Button>
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
