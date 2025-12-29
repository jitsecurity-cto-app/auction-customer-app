'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { Auction } from '../types';
import { getAuthUser } from '../lib/auth';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@design-system/components';
import { formatCurrency, formatTimeRemaining } from '@design-system/utils';
import WorkflowVisualization from './WorkflowVisualization';
import ActiveBiddingPhase from './phases/ActiveBiddingPhase';
import PendingSalePhase from './phases/PendingSalePhase';
import ShippedPhase from './phases/ShippedPhase';
import CompletePhase from './phases/CompletePhase';
import BidHistory from './BidHistory';
import styles from './AuctionDetail.module.css';

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
  const [auction, setAuction] = useState<AuctionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.get<AuctionWithDetails>(`/auctions/${auctionId}`);
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
    fetchAuction();
  }, [auctionId]);

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
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <p>Loading auction details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <Card variant="outlined" padding="md" className={styles.errorCard}>
            <CardContent>
              <h2 className={styles.errorTitle}>Error Loading Auction</h2>
              <p className={styles.errorMessage}>{error}</p>
              <Button variant="primary" onClick={fetchAuction}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <Card variant="outlined" padding="md" className={styles.notFoundCard}>
            <CardContent>
              <h2 className={styles.notFoundTitle}>Auction Not Found</h2>
              <p>The auction you're looking for doesn't exist or has been removed.</p>
              <Link href="/auctions">
                <Button variant="primary">Browse Auctions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const user = getAuthUser();
  const isSeller = user && auction.created_by === user.id;
  const isBuyer = user && auction.winner_id === user.id;
  const workflowState = auction.workflow_state || (auction.status === 'active' ? 'active' : 'pending_sale');

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>{auction.title}</h1>
              {auction.creator && (
                <div className={styles.creator}>
                  <span className={styles.creatorLabel}>Seller:</span>
                  <span className={styles.creatorName}>{auction.creator.name || auction.creator.email}</span>
                </div>
              )}
            </div>
            <div className={styles.badges}>
              <Badge variant={isEnded ? 'error' : 'success'} size="md">
                {auction.status}
              </Badge>
              {workflowState && workflowState !== 'active' && (
                <Badge variant={workflowState === 'pending_sale' ? 'warning' : workflowState === 'shipping' ? 'info' : 'default'} size="md">
                  {workflowState.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <Card variant="elevated" padding="md" className={styles.statsCard}>
            <CardContent>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Current Bid</div>
                  <div className={styles.currentBid}>
                    {formatCurrency(auction.current_bid || auction.starting_price)}
                  </div>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Starting Price</div>
                  <div className={styles.statValue}>
                    {formatCurrency(auction.starting_price)}
                  </div>
                </div>
                {!isEnded && (
                  <>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statItem}>
                      <div className={styles.statLabel}>Time Remaining</div>
                      <div className={styles.timeValue}>{timeRemaining}</div>
                    </div>
                  </>
                )}
                {isEnded && auction.closed_at && (
                  <>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statItem}>
                      <div className={styles.statLabel}>Ended</div>
                      <div className={styles.statValue}>
                        {new Date(auction.closed_at).toLocaleDateString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Visualization */}
          <Card variant="outlined" padding="md" className={styles.workflowCard}>
            <CardHeader>
              <CardTitle as="h2" className={styles.workflowTitle}>Auction Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowVisualization currentState={workflowState} />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column - Description */}
          <div className={styles.leftColumn}>
            <Card variant="outlined" padding="md" className={styles.descriptionCard}>
              <CardHeader>
                <CardTitle as="h2">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: auction.description }}
                />
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card variant="outlined" padding="md" className={styles.bidHistoryCard}>
              <CardHeader>
                <CardTitle as="h2">Bid History</CardTitle>
              </CardHeader>
              <CardContent>
                <BidHistory auctionId={auctionId} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Phase Actions */}
          <div className={styles.rightColumn}>
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
