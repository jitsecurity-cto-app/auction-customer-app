'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Textarea } from '@design-system/components';
import styles from './OrderForm.module.css';

interface OrderFormProps {
  auctionId: string;
  onOrderCreated?: () => void;
}

export default function OrderForm({ auctionId, onOrderCreated }: OrderFormProps) {
  const router = useRouter();
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // No input validation (intentional vulnerability)
      // XSS vulnerability: shipping address is not sanitized
      await api.createOrder({
        auction_id: auctionId,
        shipping_address: shippingAddress,
      });

      if (onOrderCreated) {
        onOrderCreated();
      } else {
        router.push('/orders');
      }
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      console.error('Failed to create order:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" padding="md" className={styles.container}>
      <CardHeader>
        <CardTitle as="h2">Create Order</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={styles.description}>
          You won this auction! Please provide your shipping address to complete your order.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Textarea
            id="shipping-address"
            label="Shipping Address"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Enter your full shipping address"
            rows={4}
            error={error || undefined}
            fullWidth
            // No input sanitization (XSS vulnerability)
          />

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              isLoading={loading}
            >
              Create Order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
