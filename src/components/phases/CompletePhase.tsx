'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Textarea, Badge } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import styles from './PhaseComponents.module.css';

interface CompletePhaseProps {
  auction: any;
  order: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function CompletePhase({ auction, order, isSeller, isBuyer, onUpdate }: CompletePhaseProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [filingDispute, setFilingDispute] = useState(false);

  const handleFileDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please enter a reason for the dispute');
      return;
    }

    if (!confirm('File a dispute? This will be reviewed by our support team.')) {
      return;
    }

    try {
      setFilingDispute(true);
      await api.createDispute({
        auction_id: auction.id,
        order_id: order.id,
        reason: disputeReason,
        filed_by_role: isSeller ? 'seller' : 'buyer',
      });
      
      alert('Dispute filed successfully. Our support team will review it shortly.');
      setDisputeReason('');
      onUpdate();
    } catch (err) {
      // If endpoint doesn't exist yet, show a message
      if (err instanceof Error && err.message.includes('404')) {
        alert('Dispute filing will be available soon. For now, please contact support.');
      } else {
        alert(err instanceof Error ? err.message : 'Failed to file dispute');
      }
    } finally {
      setFilingDispute(false);
    }
  };

  return (
    <div className={styles.phaseContainer}>
      <Card variant="outlined" padding="md" className={styles.completeCard}>
        <CardHeader>
          <CardTitle>Transaction Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.completionInfo}>
            <Badge variant="success" size="md">✓ Completed</Badge>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Final Amount:</span>
              <strong>{formatCurrency(order?.total_amount || auction.current_bid)}</strong>
            </div>
            {order?.completed_at && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Completed On:</span>
                <span>{new Date(order.completed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className={styles.disputeSection}>
            <h3 className={styles.sectionTitle}>File a Dispute</h3>
            <p className={styles.infoText}>
              If you have any issues with this transaction, you can file a dispute. 
              Our support team will review it and contact you.
            </p>
            <Textarea
              label="Dispute Reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              fullWidth
            />
            <Button
              variant="danger"
              onClick={handleFileDispute}
              disabled={filingDispute || !disputeReason.trim()}
              isLoading={filingDispute}
              fullWidth
            >
              {filingDispute ? 'Filing Dispute...' : 'File Dispute'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
