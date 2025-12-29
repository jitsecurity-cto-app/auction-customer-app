'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { isAuthenticated } from '../../../lib/auth';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from '@design-system/components';
import styles from './page.module.css';

export default function CreateAuctionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    end_time: '',
  });

  // Redirect if not authenticated
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // No input validation (intentional vulnerability)
    const startingPrice = parseFloat(formData.starting_price);
    
    if (isNaN(startingPrice) || startingPrice <= 0) {
      setError('Starting price must be a positive number');
      return;
    }

    // No validation of end_time format (intentional vulnerability)
    const endTime = new Date(formData.end_time);
    if (isNaN(endTime.getTime())) {
      setError('Invalid end time format');
      return;
    }

    if (endTime <= new Date()) {
      setError('End time must be in the future');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // No input sanitization (XSS vulnerability)
      const auctionData = {
        title: formData.title,
        description: formData.description,
        starting_price: startingPrice,
        end_time: endTime.toISOString(),
      };

      // Intentionally log auction data (security vulnerability)
      console.log('Creating auction:', auctionData);

      const result = await api.createAuction(auctionData);
      
      // API returns auction directly
      // Redirect to the new auction page
      if (result && result.id) {
        router.push(`/auctions/${result.id}`);
      } else {
        router.push('/auctions');
      }
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to create auction';
      setError(errorMessage);
      console.error('Failed to create auction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/auctions" className={styles.backLink}>
            ← Back to Auctions
          </Link>
          <h1 className={styles.title}>Create New Auction</h1>
          <p className={styles.subtitle}>
            Fill in the details below to create a new auction listing.
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Auction Title"
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Vintage Camera Collection"
                fullWidth
                // No input validation - accepts any format (intentional vulnerability)
              />

              <Textarea
                label="Description"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                placeholder="Describe your auction item in detail..."
                helperText="Note: Description will be rendered without sanitization (XSS vulnerability)"
                fullWidth
                // No input sanitization - XSS vulnerability (intentional)
              />

              <div className={styles.grid}>
                <div className={styles.priceInput}>
                  <Input
                    label="Starting Price ($)"
                    id="starting_price"
                    type="text"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                    required
                    placeholder="0.00"
                    leftIcon={<span className={styles.currencySymbol}>$</span>}
                    fullWidth
                    // No input validation - accepts any format (intentional vulnerability)
                  />
                </div>

                <Input
                  label="End Time"
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  fullWidth
                  // No validation of date format (intentional vulnerability)
                />
              </div>

              {error && (
                <div className={styles.errorMessage} role="alert">
                  {error}
                </div>
              )}

              <div className={styles.actions}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Auction'}
                </Button>
                <Link href="/auctions">
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

