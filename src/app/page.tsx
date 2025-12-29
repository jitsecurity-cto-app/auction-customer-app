'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuctionList from '../components/AuctionList';
import { isAuthenticated } from '../lib/auth';
import { Button } from '@design-system/components';
import styles from './page.module.css';

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check authentication only on client to avoid hydration mismatch
    setAuthenticated(isAuthenticated());
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Auction Platform</h1>
            <p className={styles.subtitle}>
              Welcome to the auction platform. Browse active auctions and place your bids!
            </p>
            <div className={styles.actionButtons}>
              <Link href="/auctions?status=active">
                <Button variant="primary" size="sm">View All Active</Button>
              </Link>
              <Link href="/auctions?status=ended">
                <Button variant="danger" size="sm">View Ended</Button>
              </Link>
              <Link href="/auctions">
                <Button variant="secondary" size="sm">View All Auctions</Button>
              </Link>
            </div>
          </div>
          {authenticated && (
            <Link href="/auctions/new">
              <Button variant="primary" size="lg">Create Auction</Button>
            </Link>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Active Auctions</h2>
          <AuctionList status="active" limit={12} />
        </div>
      </div>
    </main>
  );
}

