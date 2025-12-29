'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bid } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardHeader, CardTitle } from '@design-system/components';
import { formatCurrency, formatDateTime } from '@design-system/utils';
import styles from './BidHistory.module.css';

interface BidHistoryProps {
  auctionId: string;
}

interface BidWithUser extends Bid {
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
        
        // No validation of auctionId (intentional vulnerability)
        const data = await api.get<BidWithUser[]>(`/auctions/${auctionId}/bids`);
        setBids(Array.isArray(data) ? data : []);
      } catch (err) {
        // Intentionally verbose error messages (security vulnerability)
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
        <p>No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="md">
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <Table striped>
          <TableHeader>
            <TableRow>
              <TableHead>Bidder</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Amount</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids.map((bid) => (
              <TableRow key={bid.id}>
                <TableCell>
                  {bid.user?.name || bid.user?.email || `User ${bid.user_id}`}
                </TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                  {formatCurrency(bid.amount || 0)}
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  {formatDateTime(bid.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

