'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bid } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@design-system/components';
import { formatCurrency, formatDateTime } from '@design-system/utils';
import styles from './BidHistory.module.css';

interface BidHistoryProps {
  auctionId: string;
}

interface BidWithUser {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export default function BidHistory({ auctionId }: BidHistoryProps) {
  const [bids, setBids] = useState<BidWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBids() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await api.get<BidWithUser[]>(`/auctions/${auctionId}/bids`);
        setBids(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to load bids';
        setError(errorMessage);
        console.error('Failed to fetch bids:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBids();
  }, [auctionId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading bid history...</p>
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

  if (bids.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  // Sort bids by amount descending, then by time descending
  const sortedBids = [...bids].sort((a, b) => {
    if (b.amount !== a.amount) {
      return b.amount - a.amount;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const highestBid = sortedBids[0];

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Bids:</span>
          <span className={styles.summaryValue}>{bids.length}</span>
        </div>
        {highestBid && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Highest Bid:</span>
            <span className={styles.summaryValue}>{formatCurrency(highestBid.amount)}</span>
          </div>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <Table striped hover>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Bidder</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Amount</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBids.map((bid, index) => (
              <TableRow key={bid.id} className={index === 0 ? styles.highestBid : ''}>
                <TableCell>
                  <Badge variant={index === 0 ? 'success' : 'default'} size="sm">
                    #{index + 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={styles.bidderInfo}>
                    <span className={styles.bidderName}>
                      {bid.user?.name || bid.user?.email || `User ${bid.user_id}`}
                    </span>
                    {index === 0 && (
                      <Badge variant="success" size="sm">Highest</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                  {formatCurrency(bid.amount || 0)}
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <span className={styles.timeText}>{formatDateTime(bid.created_at)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
