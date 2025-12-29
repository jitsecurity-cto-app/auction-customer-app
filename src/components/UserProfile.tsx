'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Bid, Auction } from '../types';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '@design-system/components';
import { formatCurrency, formatDate, formatDateTime } from '@design-system/utils';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  userId: string;
}

interface UserWithDetails extends User {
  bids?: Bid[];
  auctions?: Auction[];
  password_hash?: string; // Intentionally exposed (security vulnerability)
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // No authorization check - IDOR vulnerability (can access any user by ID)
      // No validation of userId (intentional vulnerability)
      const data = await api.getUserById(userId);
      setUser(data);
      setEditForm({
        name: data.name || '',
        email: data.email || '',
        password: '',
      });
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load user profile';
      setError(errorMessage);
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleEdit = () => {
    setEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError(null);
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaveLoading(true);
      setSaveError(null);

      // No input validation (intentional vulnerability)
      // No authorization check - anyone can update any user (IDOR vulnerability)
      const updateData: any = {};
      if (editForm.name !== user.name) {
        updateData.name = editForm.name;
      }
      if (editForm.email !== user.email) {
        updateData.email = editForm.email;
      }
      if (editForm.password) {
        updateData.password = editForm.password; // No password strength validation
      }

      // Intentionally log update data (security vulnerability)
      console.log('Updating user:', { userId, updateData });

      const updatedUser = await api.updateUser(userId, updateData);
      
      setUser(updatedUser);
      setEditing(false);
      setEditForm({ ...editForm, password: '' });
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update profile';
      setSaveError(errorMessage);
      console.error('Failed to update user:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.notFound}>
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <h1 className={styles.pageTitle}>User Profile</h1>

        {!editing ? (
          <Card variant="elevated" padding="md">
            <CardContent>
              <div className={styles.profileInfo}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Name</div>
                  <div className={styles.infoValue}>{user.name}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Email</div>
                  <div className={styles.infoValueSecondary}>{user.email}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Role</div>
                  <div className={styles.infoValueSecondary} style={{ textTransform: 'capitalize' }}>
                    {user.role}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Member Since</div>
                  <div className={styles.infoValueSecondary}>
                    {formatDate(user.created_at)}
                  </div>
                </div>
                
                {/* Intentionally display password hash (security vulnerability) */}
                {user.password_hash && (
                  <Card variant="outlined" padding="sm" className={styles.warningCard}>
                    <div className={styles.warningLabel}>
                      Password Hash (intentionally exposed for lab):
                    </div>
                    <code className={styles.hashCode}>
                      {user.password_hash}
                    </code>
                  </Card>
                )}

                <Button variant="primary" onClick={handleEdit}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated" padding="md">
            <CardContent>
              <div className={styles.editForm}>
                <Input
                  label="Name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  fullWidth
                  // No input validation (intentional vulnerability)
                />
                <Input
                  label="Email"
                  type="text"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  fullWidth
                  // No email validation (intentional vulnerability)
                />
                <Input
                  label="New Password (leave blank to keep current)"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  fullWidth
                  // No password strength validation (intentional vulnerability)
                />

                {saveError && (
                  <div className={styles.errorMessage} role="alert">
                    {saveError}
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={saveLoading}
                    disabled={saveLoading}
                  >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={saveLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bidding History */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Bidding History</h2>
        {user.bids && user.bids.length > 0 ? (
          <Card variant="elevated" padding="none">
            <Table striped>
              <TableHeader>
                <TableRow>
                  <TableHead>Auction</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Bid Amount</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <Link href={`/auctions/${bid.auction_id}`} className={styles.auctionLink}>
                        Auction #{bid.auction_id}
                      </Link>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                      {formatCurrency(bid.amount || 0)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {formatDateTime(bid.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card variant="outlined" padding="md" className={styles.emptyCard}>
            <p className={styles.emptyText}>No bids yet. Start bidding on auctions!</p>
          </Card>
        )}
      </div>

      {/* Created Auctions */}
      {user.auctions && user.auctions.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Created Auctions</h2>
          <Card variant="elevated" padding="none">
            <Table striped>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Current Bid</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.auctions.map((auction) => (
                  <TableRow key={auction.id}>
                    <TableCell>
                      <Link href={`/auctions/${auction.id}`} className={styles.auctionLink}>
                        {auction.title}
                      </Link>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                      {formatCurrency(auction.current_bid || 0)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Badge variant={auction.status === 'active' ? 'success' : 'default'} size="sm">
                        {auction.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {formatDate(auction.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}

