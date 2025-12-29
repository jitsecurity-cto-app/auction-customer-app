'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Auction } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@design-system/components';
import { formatCurrency, formatTimeRemaining } from '@design-system/utils';
import styles from './AuctionCard.module.css';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
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
  }, [auction.end_time, auction.status]);

  const statusVariant = isEnded ? 'error' : 'success';

  return (
    <Link href={`/auctions/${auction.id}`} className={styles.cardLink}>
      <Card variant="elevated" padding="md" className={styles.auctionCard}>
        <CardHeader>
          <CardTitle>{auction.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            // XSS vulnerability: using dangerouslySetInnerHTML without sanitization
            dangerouslySetInnerHTML={{ __html: auction.description }}
          />
        </CardContent>
        <CardFooter className={styles.cardFooter}>
          <div className={styles.priceSection}>
            <div className={styles.currentBid}>
              {formatCurrency(auction.current_bid || auction.starting_price)}
            </div>
            <div className={styles.startingPrice}>
              Starting: {formatCurrency(auction.starting_price)}
            </div>
          </div>
          <div className={styles.statusSection}>
            <Badge variant={statusVariant} size="sm">
              {auction.status}
            </Badge>
            <div className={styles.timeRemaining}>{timeRemaining}</div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

