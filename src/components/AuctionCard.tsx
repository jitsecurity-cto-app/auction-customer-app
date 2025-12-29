'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Auction } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@design-system/components';
import { formatCurrency, formatTimeRemaining } from '@design-system/utils';
import styles from './AuctionCard.module.css';

interface AuctionCardProps {
  auction: Auction & { workflow_state?: 'active' | 'pending_sale' | 'shipping' | 'complete' };
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
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
  }, [auction.end_time, auction.status, mounted]);

  const statusVariant = isEnded ? 'error' : 'success';
  const workflowState = auction.workflow_state || (auction.status === 'active' ? 'active' : 'pending_sale');

  const getWorkflowBadgeVariant = (state?: string) => {
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

  // Truncate description for card view
  const truncateDescription = (html: string, maxLength: number = 100) => {
    const text = html.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) return html;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link href={`/auctions/${auction.id}`} className={styles.cardLink}>
      <Card variant="elevated" padding="md" className={styles.auctionCard}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.headerTop}>
            <CardTitle className={styles.cardTitle}>{auction.title}</CardTitle>
            <div className={styles.badges}>
              <Badge variant={statusVariant} size="sm">
                {auction.status}
              </Badge>
              {workflowState && workflowState !== 'active' && (
                <Badge variant={getWorkflowBadgeVariant(workflowState)} size="sm">
                  {workflowState.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: truncateDescription(auction.description) }}
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
          <div className={styles.metaSection}>
            <div className={styles.timeRemaining}>
              {isEnded ? (
                <span className={styles.endedText}>Ended</span>
              ) : (
                <>
                  <span className={styles.timeLabel}>Ends in:</span>
                  <span className={styles.timeValue}>{timeRemaining}</span>
                </>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
