'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import { Order } from '@/types';
import Link from 'next/link';
import { Button, Card, Badge } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import styles from './page.module.css';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [filter, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = getAuthUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // IDOR vulnerability: Can fetch orders for any user by modifying buyer_id/seller_id
      const params: any = {};
      if (filter === 'buyer') {
        params.buyer_id = user.id;
      } else if (filter === 'seller') {
        params.seller_id = user.id;
      }
      // No authorization check - can access any user's orders

      const response = await api.getOrders(params);
      setOrders(response.data || response || []);
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
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
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <Button variant="primary" onClick={fetchOrders}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Orders</h1>
        <div className={styles.filters}>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All Orders
          </Button>
          <Button
            variant={filter === 'buyer' ? 'primary' : 'secondary'}
            onClick={() => setFilter('buyer')}
          >
            As Buyer
          </Button>
          <Button
            variant={filter === 'seller' ? 'primary' : 'secondary'}
            onClick={() => setFilter('seller')}
          >
            As Seller
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card variant="outlined" padding="md" className={styles.emptyCard}>
          <p>No orders found.</p>
        </Card>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <Card key={order.id} variant="outlined" padding="md" className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <Link href={`/orders/${order.id}`}>
                    <h3 className={styles.orderTitle}>
                      Order #{order.id}
                    </h3>
                  </Link>
                  {order.auction && (
                    <Link href={`/auctions/${order.auction.id}`}>
                      <p className={styles.auctionTitle}>{order.auction.title}</p>
                    </Link>
                  )}
                </div>
                <div className={styles.orderStatus}>
                  <Badge variant={getStatusBadgeVariant(order.status)} size="md">
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className={styles.orderDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total Amount:</span>
                  <span className={styles.detailValue}>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Payment Status:</span>
                  <Badge variant={getStatusBadgeVariant(order.payment_status)} size="sm">
                    {order.payment_status}
                  </Badge>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Shipping Status:</span>
                  <Badge variant={getStatusBadgeVariant(order.shipping_status)} size="sm">
                    {order.shipping_status}
                  </Badge>
                </div>
                {order.tracking_number && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Tracking:</span>
                    <span className={styles.detailValue}>{order.tracking_number}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Created:</span>
                  <span className={styles.detailValue}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.orderActions}>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
