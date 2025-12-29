'use client';

import { useState, FormEvent } from 'react';
import { api } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import { useRouter } from 'next/navigation';

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
      <div style={{ 
        padding: '1.5rem', 
        border: '1px solid #e5e7eb', 
        borderRadius: '0.5rem',
        backgroundColor: '#f9fafb',
        textAlign: 'center'
      }}>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Please <a href="/login" style={{ color: '#3b82f6' }}>login</a> to place a bid
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      border: '1px solid #e5e7eb', 
      borderRadius: '0.5rem',
      backgroundColor: 'white'
    }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Place a Bid</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label 
            htmlFor="bid-amount" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}
          >
            Bid Amount
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>$</span>
            <input
              id="bid-amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={currentBid.toFixed(2)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem'
              }}
              // No input validation - accepts any format (intentional vulnerability)
            />
          </div>
          <p style={{ 
            marginTop: '0.25rem', 
            fontSize: '0.875rem', 
            color: '#6b7280' 
          }}>
            Current bid: ${currentBid.toFixed(2)}
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem',
            backgroundColor: '#d1fae5',
            color: '#059669',
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}>
            Bid placed successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
}

