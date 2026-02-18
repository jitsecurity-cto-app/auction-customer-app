'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import { Order } from '@/types';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import { useResolvedParam } from '@/hooks/useResolvedParam';
import styles from './page.module.css';

interface OrderDetailPageContentProps {
  orderId: string;
}

export default function OrderDetailPageContent({ orderId: rawOrderId }: OrderDetailPageContentProps) {
  const orderId = useResolvedParam(rawOrderId);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // IDOR vulnerability: No authorization check - can access any order by ID
      const response = await api.getOrderById(orderId);
      const orderData = response.data || response;
      setOrder(orderData);
      setShippingAddress(orderData.shipping_address || '');
      setTrackingNumber(orderData.tracking_number || '');
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipping = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      // No authorization check - anyone can update any order
      await api.updateOrder(orderId, {
        tracking_number: trackingNumber,
        shipping_status: trackingNumber ? 'shipped' : order.shipping_status,
      });
      await fetchOrder();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shipping';
      setError(errorMessage);
      console.error('Failed to update shipping:', err);
    } finally {
      setUpdating(false);
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'success';
      case 'shipped':
      case 'paid':
        return 'info';
      case 'pending_payment':
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <Button variant="primary" onClick={fetchOrder}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Order not found.</p>
          <Link href="/orders">
            <Button variant="primary">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const user = getAuthUser();
  const isBuyer = user && order.buyer_id === user.id;
  const isSeller = user && order.seller_id === user.id;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/orders">
          <Button variant="secondary" size="sm">
            ← Back to Orders
          </Button>
        </Link>
        <h1 className={styles.title}>Order #{order.id}</h1>
        <Badge variant={getStatusBadgeVariant(order.status)} size="lg">
          {order.status}
        </Badge>
      </div>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p>{error}</p>
        </Card>
      )}

      <div className={styles.content}>
        <div className={styles.mainSection}>
          {order.auction && (
            <Card variant="outlined" padding="md" className={styles.section}>
              <h2 className={styles.sectionTitle}>Auction Details</h2>
              <Link href={`/auctions/${order.auction.id}`}>
                <h3 className={styles.auctionTitle}>{order.auction.title}</h3>
              </Link>
              <p className={styles.auctionDescription}>{order.auction.description}</p>
            </Card>
          )}

          <Card variant="outlined" padding="md" className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Amount:</span>
                <span className={styles.infoValue}>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Payment Status:</span>
                <Badge variant={getStatusBadgeVariant(order.payment_status)} size="sm">
                  {order.payment_status}
                </Badge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Shipping Status:</span>
                <Badge variant={getStatusBadgeVariant(order.shipping_status)} size="sm">
                  {order.shipping_status}
                </Badge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created:</span>
                <span className={styles.infoValue}>
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              {order.updated_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last Updated:</span>
                  <span className={styles.infoValue}>
                    {new Date(order.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card variant="outlined" padding="md" className={styles.section}>
            <h2 className={styles.sectionTitle}>Shipping Information</h2>
            {order.shipping_address && (
              <div className={styles.shippingAddress}>
                <p className={styles.addressLabel}>Shipping Address:</p>
                <p className={styles.addressValue}>{order.shipping_address}</p>
              </div>
            )}
            {order.tracking_number && (
              <div className={styles.trackingInfo}>
                <p className={styles.trackingLabel}>Tracking Number:</p>
                <p className={styles.trackingValue}>{order.tracking_number}</p>
              </div>
            )}
            {isSeller && (
              <div className={styles.shippingUpdate}>
                <h3 className={styles.updateTitle}>Update Shipping</h3>
                <div className={styles.updateForm}>
                  <Input
                    label="Tracking Number"
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="primary"
                    onClick={handleUpdateShipping}
                    disabled={updating}
                    isLoading={updating}
                  >
                    Update Shipping
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className={styles.sidebar}>
          {order.buyer && (
            <Card variant="outlined" padding="md" className={styles.contactCard}>
              <h3 className={styles.contactTitle}>Buyer Contact</h3>
              <p className={styles.contactName}>{order.buyer.name}</p>
              <p className={styles.contactEmail}>{order.buyer.email}</p>
              {order.buyer.phone && (
                <p className={styles.contactPhone}>Phone: {order.buyer.phone}</p>
              )}
              {order.buyer.address && (
                <p className={styles.contactAddress}>Address: {order.buyer.address}</p>
              )}
            </Card>
          )}

          {order.seller && (
            <Card variant="outlined" padding="md" className={styles.contactCard}>
              <h3 className={styles.contactTitle}>Seller Contact</h3>
              <p className={styles.contactName}>{order.seller.name}</p>
              <p className={styles.contactEmail}>{order.seller.email}</p>
              {order.seller.phone && (
                <p className={styles.contactPhone}>Phone: {order.seller.phone}</p>
              )}
              {order.seller.address && (
                <p className={styles.contactAddress}>Address: {order.seller.address}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
