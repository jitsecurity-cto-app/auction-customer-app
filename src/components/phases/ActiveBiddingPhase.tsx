'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import BidForm from '../BidForm';
import BidHistory from '../BidHistory';
import styles from './PhaseComponents.module.css';

interface ActiveBiddingPhaseProps {
  auction: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function ActiveBiddingPhase({ auction, isSeller, isBuyer, onUpdate }: ActiveBiddingPhaseProps) {
  const router = useRouter();
  const [closingAuction, setClosingAuction] = useState(false);

  const handleCloseAuction = async () => {
    if (!confirm('Are you sure you want to close this auction early? This will end bidding immediately.')) {
      return;
    }

    try {
      setClosingAuction(true);
      await api.closeAuction(auction.id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close auction');
    } finally {
      setClosingAuction(false);
    }
  };

  if (isSeller) {
    return (
      <div className={styles.phaseContainer}>
        <Card variant="outlined" padding="md" className={styles.sellerCard}>
          <CardHeader>
            <CardTitle>Seller View - Active Bidding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Current Highest Bid:</span>
                <span className={styles.statValue}>{formatCurrency(auction.current_bid || auction.starting_price)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Starting Price:</span>
                <span className={styles.statValue}>{formatCurrency(auction.starting_price)}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                variant="danger"
                onClick={handleCloseAuction}
                disabled={closingAuction}
                isLoading={closingAuction}
              >
                {closingAuction ? 'Closing...' : 'Stop Sale / Close Auction'}
              </Button>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>All Bids</h3>
              <BidHistory auctionId={auction.id} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.phaseContainer}>
      <Card variant="outlined" padding="md" className={styles.buyerCard}>
        <CardHeader>
          <CardTitle>Place Your Bid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.bidInfo}>
            <p className={styles.currentBidText}>
              Current Bid: <strong>{formatCurrency(auction.current_bid || auction.starting_price)}</strong>
            </p>
            <p className={styles.startingPriceText}>
              Starting Price: {formatCurrency(auction.starting_price)}
            </p>
          </div>
          <BidForm 
            auctionId={auction.id} 
            currentBid={Number(auction.current_bid || auction.starting_price)}
            onBidPlaced={onUpdate}
          />
        </CardContent>
      </Card>

      <div className={styles.section}>
        <BidHistory auctionId={auction.id} />
      </div>
    </div>
  );
}
