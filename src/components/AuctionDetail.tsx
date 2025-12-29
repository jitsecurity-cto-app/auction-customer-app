'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction } from '../types';
import BidForm from './BidForm';
import BidHistory from './BidHistory';
import { Card, CardContent, Badge } from '@design-system/components';
import { formatCurrency, formatTimeRemaining } from '@design-system/utils';
import styles from './AuctionDetail.module.css';

interface AuctionDetailProps {
  auctionId: string;
}

interface AuctionWithDetails extends Auction {
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
}

export default function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const [auction, setAuction] = useState<AuctionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // No validation of auctionId (intentional vulnerability)
      const data = await api.get<AuctionWithDetails>(`/auctions/${auctionId}`);
      setAuction(data);
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
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
    fetchAuction();
  }, [auctionId]);

  useEffect(() => {
    if (!auction) return;

    // Calculate time-based values only on client to avoid hydration mismatch
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
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [auction]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading auction details...</p>
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

  if (!auction) {
    return (
      <div className={styles.notFound}>
        <p>Auction not found.</p>
      </div>
    );
  }

  const statusVariant = isEnded ? 'error' : 'success';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{auction.title}</h1>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Current Bid</div>
            <div className={styles.currentBid}>
              {formatCurrency(auction.current_bid || auction.starting_price)}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Starting Price</div>
            <div className={styles.statValue}>
              {formatCurrency(auction.starting_price)}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Status</div>
            <Badge variant={statusVariant} size="md">
              {auction.status}
            </Badge>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Time Remaining</div>
            <div className={styles.statValue}>{timeRemaining}</div>
          </div>
        </div>

        <Card variant="outlined" padding="md" className={styles.descriptionCard}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <CardContent>
            <div
              className={styles.description}
              // XSS vulnerability: using dangerouslySetInnerHTML without sanitization
              dangerouslySetInnerHTML={{ __html: auction.description }}
            />
          </CardContent>
        </Card>

        {auction.creator && (
          <div className={styles.creator}>
            Created by: {auction.creator.name || auction.creator.email}
          </div>
        )}
      </div>

      {auction.status === 'active' && !isEnded && (
        <div className={styles.bidForm}>
          <BidForm 
            auctionId={auctionId} 
            currentBid={Number(auction.current_bid || 0)}
            onBidPlaced={fetchAuction}
          />
        </div>
      )}

      <BidHistory auctionId={auctionId} />
    </div>
  );
}

