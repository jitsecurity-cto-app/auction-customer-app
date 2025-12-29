'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuctionList from '../../components/AuctionList';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { Button, Card, CardContent, Badge } from '@design-system/components';
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

  const hasActiveFilters = statusFilter !== undefined || search || minPrice !== undefined || maxPrice !== undefined;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Browse Auctions</h1>
            <p className={styles.subtitle}>
              Discover unique items and place your bids
            </p>
          </div>
          {authenticated && (
            <Link href="/auctions/new">
              <Button variant="primary" size="lg">Create Auction</Button>
            </Link>
          )}
        </div>

        {/* Search and Filters Section */}
        <div className={styles.filtersSection}>
          <Card variant="outlined" padding="md" className={styles.searchCard}>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Status Filter */}
          <Card variant="outlined" padding="sm" className={styles.filterCard}>
            <CardContent>
              <div className={styles.filterHeader}>
                <span className={styles.filterLabel}>Filter by Status</span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter(undefined);
                      setSearch('');
                      setMinPrice(undefined);
                      setMaxPrice(undefined);
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className={styles.filterButtons}>
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
                  variant={statusFilter === 'ended' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('ended')}
                >
                  Ended
                </Button>
                <Button
                  variant={statusFilter === 'cancelled' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            <span className={styles.activeFiltersLabel}>Active Filters:</span>
            <div className={styles.activeFiltersList}>
              {statusFilter && (
                <Badge variant="info" size="sm">
                  Status: {statusFilter}
                </Badge>
              )}
              {search && (
                <Badge variant="info" size="sm">
                  Search: {search}
                </Badge>
              )}
              {minPrice !== undefined && (
                <Badge variant="info" size="sm">
                  Min: ${minPrice.toFixed(2)}
                </Badge>
              )}
              {maxPrice !== undefined && (
                <Badge variant="info" size="sm">
                  Max: ${maxPrice.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Auction List */}
        <div className={styles.auctionsSection}>
          <AuctionList 
            status={statusFilter} 
            search={search || undefined}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>
      </div>
    </main>
  );
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <p>Loading auctions...</p>
          </div>
        </div>
      </main>
    }>
      <AuctionsContent />
    </Suspense>
  );
}
