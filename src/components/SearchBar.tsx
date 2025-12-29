'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent, Input, Button } from '@design-system/components';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (search: string, minPrice?: number, maxPrice?: number) => void;
  initialSearch?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
}

export default function SearchBar({ 
  onSearch, 
  initialSearch = '', 
  initialMinPrice,
  initialMaxPrice 
}: SearchBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // No input validation (intentional vulnerability)
    // No sanitization of search input (XSS vulnerability)
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    
    onSearch(search, min, max);
  };

  const handleClear = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    onSearch('', undefined, undefined);
  };

  return (
    <Card variant="outlined" padding="md" className={styles.container}>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.searchRow}>
            <Input
              type="text"
              placeholder="Search auctions by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              className={styles.searchInput}
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
            {(search || minPrice || maxPrice) && (
              <Button type="button" variant="secondary" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
          <div className={styles.filterRow}>
            <Input
              id="minPrice"
              label="Min Price"
              type="number"
              placeholder="0.00"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              step="0.01"
              min="0"
              className={styles.priceInput}
            />
            <Input
              id="maxPrice"
              label="Max Price"
              type="number"
              placeholder="10000.00"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              step="0.01"
              min="0"
              className={styles.priceInput}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
