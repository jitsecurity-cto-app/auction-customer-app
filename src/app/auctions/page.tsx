'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuctionList from '../../components/AuctionList';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { Button } from '@design-system/components';
import styles from './page.module.css';

function AuctionsContent() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<'active' | 'ended' | 'cancelled' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const authenticated = isAuthenticated();

  useEffect(() => {
    // Get status from URL query parameter
    const statusParam = searchParams.get('status');
    if (statusParam === 'active' || statusParam === 'ended' || statusParam === 'cancelled') {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter(undefined);
    }
  }, [searchParams]);

  return (
    <main>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>All Auctions</h1>
          {authenticated && (
            <Link href="/auctions/new">
              <Button variant="primary" size="lg">Create Auction</Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <SearchBar
          onSearch={(searchTerm, min, max) => {
            setSearch(searchTerm);
            setMinPrice(min);
            setMaxPrice(max);
          }}
          initialSearch={search}
          initialMinPrice={minPrice}
          initialMaxPrice={maxPrice}
        />

        {/* Status Filter */}
        <div className={styles.filters}>
          <Button
            variant={statusFilter === undefined ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'ended' ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('ended')}
          >
            Ended
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'secondary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>

        <AuctionList 
          status={statusFilter} 
          search={search || undefined}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
      </div>
    </main>
  );
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={
      <main>
        <div className={styles.container}>
          <p>Loading...</p>
        </div>
      </main>
    }>
      <AuctionsContent />
    </Suspense>
  );
}

