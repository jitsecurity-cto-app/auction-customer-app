'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Badge } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import styles from './PhaseComponents.module.css';

interface PendingSalePhaseProps {
  auction: any;
  order: any;
  isSeller: boolean;
  isBuyer: boolean;
  onUpdate: () => void;
}

export default function PendingSalePhase({ auction, order, isSeller, isBuyer, onUpdate }: PendingSalePhaseProps) {
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order?.tracking_url || '');
  const [shippingAddress, setShippingAddress] = useState(order?.shipping_address || '');
  const [updating, setUpdating] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number || '');
      setTrackingUrl(order.tracking_url || '');
      setShippingAddress(order.shipping_address || '');
    }
  }, [order]);

  const handleCreateOrder = async () => {
    if (!shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    try {
      setCreatingOrder(true);
      await api.createOrder({
        auction_id: auction.id,
        shipping_address: shippingAddress,
      });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleUpdateOrder = async (updates: any) => {
    if (!order) return;

    try {
      setUpdating(true);
      await api.updateOrder(order.id, updates);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!trackingNumber.trim() && !trackingUrl.trim()) {
      alert('Please enter a tracking number or tracking URL');
      return;
    }

    const updates: any = {
      tracking_number: trackingNumber,
      shipping_status: 'shipped',
      status: 'shipped',
    };

    if (trackingUrl.trim()) {
      updates.tracking_url = trackingUrl;
    }

    await handleUpdateOrder(updates);
    
    // Also update workflow state
    try {
      await api.updateWorkflowState(auction.id, 'shipping');
      onUpdate();
    } catch (err) {
      console.error('Failed to update workflow state:', err);
    }
  };

  if (isBuyer && !order) {
    return (
      <div className={styles.phaseContainer}>
        <Card variant="outlined" padding="md" className={styles.buyerCard}>
          <CardHeader>
            <CardTitle>Action Required: Complete Your Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.alertMessage} style={{ 
              padding: '12px', 
              marginBottom: '16px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '4px' 
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: '#856404' }}>
                ⚠️ The seller is waiting for you to complete payment and shipping details. 
                Please provide your shipping address below to proceed with your purchase.
              </p>
            </div>

            <div className={styles.orderSummary}>
              <h3 className={styles.sectionTitle}>Order Summary</h3>
              <div className={styles.summaryItem}>
                <span>Item:</span>
                <strong>{auction.title}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Winning Bid:</span>
                <strong>{formatCurrency(auction.current_bid)}</strong>
              </div>
            </div>

            <div className={styles.formSection}>
              <Textarea
                label="Shipping Address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your full shipping address"
                rows={4}
                fullWidth
                required
              />
            </div>

            <Button
              variant="primary"
              onClick={handleCreateOrder}
              disabled={creatingOrder || !shippingAddress.trim()}
              isLoading={creatingOrder}
              fullWidth
            >
              {creatingOrder ? 'Creating Order...' : 'Complete Purchase & Submit Shipping Details'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.phaseContainer}>
      {isBuyer && order && (
        <Card variant="outlined" padding="md" className={styles.buyerCard}>
          <CardHeader>
            <CardTitle>Review Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Order Status:</span>
                <Badge variant="warning" size="sm">{order.status || 'pending_payment'}</Badge>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Amount:</span>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Shipping Address:</span>
                <span>{order.shipping_address || 'Not provided'}</span>
              </div>
              {order.tracking_number && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tracking Number:</span>
                  <span>{order.tracking_number}</span>
                </div>
              )}
            </div>
            {order.status === 'pending_payment' && (
              <div className={styles.alertMessage} style={{ 
                padding: '12px', 
                marginTop: '16px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '4px' 
              }}>
                <p style={{ margin: 0, fontWeight: '500', color: '#856404' }}>
                  ⚠️ Payment is pending. Please complete payment to proceed.
                </p>
              </div>
            )}
            <p className={styles.infoText}>
              {order.status === 'pending_payment' 
                ? 'Your order has been created. Please complete payment to proceed.'
                : 'Waiting for seller to add tracking information and mark as shipped.'}
            </p>
          </CardContent>
        </Card>
      )}

      {isSeller && !order && (
        <Card variant="outlined" padding="md" className={styles.sellerCard}>
          <CardHeader>
            <CardTitle>Waiting for Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.alertMessage} style={{ 
              padding: '12px', 
              marginBottom: '16px', 
              backgroundColor: '#d1ecf1', 
              border: '1px solid #bee5eb', 
              borderRadius: '4px' 
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: '#0c5460' }}>
                ⏳ Waiting for the buyer to complete payment and provide shipping details. 
                Once the buyer submits their information, you'll be able to prepare the shipment.
              </p>
            </div>
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Winning Bid:</span>
                <strong>{formatCurrency(auction.current_bid)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <Badge variant="warning" size="sm">Pending Buyer Action</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isSeller && order && (
        <Card variant="outlined" padding="md" className={styles.sellerCard}>
          <CardHeader>
            <CardTitle>Prepare for Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Buyer:</span>
                <span>{order.buyer?.name || order.buyer?.email || `User ${order.buyer_id}`}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Shipping Address:</span>
                <span>{order.shipping_address || 'Not provided'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Amount:</span>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
            </div>

            <div className={styles.formSection}>
              <Input
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                fullWidth
              />
              <Input
                label="Tracking URL (optional)"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://tracking.example.com/..."
                type="url"
                fullWidth
              />
            </div>

            <Button
              variant="primary"
              onClick={handleMarkAsShipped}
              disabled={updating || (!trackingNumber.trim() && !trackingUrl.trim())}
              isLoading={updating}
              fullWidth
            >
              {updating ? 'Updating...' : 'Mark as Shipped'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
