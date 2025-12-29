'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import styles from './PhaseComponents.module.css';

interface ShippedPhaseProps {
  auction: any;
  order: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function ShippedPhase({ auction, order, isSeller, isBuyer, onUpdate }: ShippedPhaseProps) {
  const [confirming, setConfirming] = useState(false);
  const [daysUntilAutoComplete, setDaysUntilAutoComplete] = useState<number | null>(null);

  useEffect(() => {
    if (order?.shipped_at) {
      const shippedDate = new Date(order.shipped_at);
      const daysSince = Math.floor((Date.now() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - daysSince);
      setDaysUntilAutoComplete(daysRemaining);
    }
  }, [order]);

  const handleConfirmReceipt = async () => {
    if (!confirm('Confirm that you have received the item?')) {
      return;
    }

    try {
      setConfirming(true);
      await api.updateOrder(order.id, {
        shipping_status: 'delivered',
        status: 'completed',
      });
      
      // Update workflow state
      await api.updateWorkflowState(auction.id, 'complete');
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm receipt');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={styles.phaseContainer}>
      <Card variant="outlined" padding="md" className={styles.shippedCard}>
        <CardHeader>
          <CardTitle>Item Shipped</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.shippingInfo}>
            {order?.tracking_number && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tracking Number:</span>
                <strong>{order.tracking_number}</strong>
              </div>
            )}
            {order?.tracking_url && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tracking Link:</span>
                <a 
                  href={order.tracking_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.trackingLink}
                >
                  Track Package
                </a>
              </div>
            )}
            {order?.shipped_at && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Shipped On:</span>
                <span>{new Date(order.shipped_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {isBuyer && (
            <div className={styles.buyerActions}>
              <p className={styles.infoText}>
                {daysUntilAutoComplete !== null && daysUntilAutoComplete > 0
                  ? `Please confirm receipt. Order will auto-complete in ${daysUntilAutoComplete} days if not confirmed.`
                  : 'Please confirm that you have received the item.'}
              </p>
              <Button
                variant="primary"
                onClick={handleConfirmReceipt}
                disabled={confirming}
                isLoading={confirming}
                fullWidth
              >
                {confirming ? 'Confirming...' : 'Confirm Receipt'}
              </Button>
            </div>
          )}

          {isSeller && (
            <div className={styles.sellerInfo}>
              <p className={styles.infoText}>
                Waiting for buyer to confirm receipt. Order will automatically complete after 30 days if not confirmed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
