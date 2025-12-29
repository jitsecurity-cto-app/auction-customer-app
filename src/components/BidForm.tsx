'use client';

import { useState, FormEvent } from 'react';
import { api } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import styles from './BidForm.module.css';

interface BidFormProps {
  auctionId: string;
  currentBid: number;
  onBidPlaced?: () => void;
}

export default function BidForm({ auctionId, currentBid, onBidPlaced }: BidFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // No input validation (intentional vulnerability)
    const bidAmount = parseFloat(amount);
    
    if (isNaN(bidAmount)) {
      setError('Please enter a valid number');
      return;
    }

    if (bidAmount <= currentBid) {
      setError(`Bid must be greater than current bid of $${currentBid.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // No validation of auctionId or amount format (intentional vulnerability)
      await api.post(
        `/auctions/${auctionId}/bids`,
        { amount: bidAmount },
        true // requireAuth
      );

      setSuccess(true);
      setAmount('');
      
      if (onBidPlaced) {
        onBidPlaced();
      }

      // Refresh page after a short delay to show updated bid
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to place bid';
      setError(errorMessage);
      console.error('Failed to place bid:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <Card variant="outlined" padding="md" className={styles.loginPrompt}>
        <p className={styles.loginText}>
          Please <a href="/login" className={styles.loginLink}>login</a> to place a bid
        </p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="md">
      <CardHeader>
        <CardTitle>Place a Bid</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <Input
              label="Bid Amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={currentBid.toFixed(2)}
              leftIcon={<span className={styles.currencySymbol}>$</span>}
              helperText={`Current bid: ${formatCurrency(currentBid)}`}
              fullWidth
              // No input validation - accepts any format (intentional vulnerability)
            />
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              Bid placed successfully!
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Placing Bid...' : 'Place Bid'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

