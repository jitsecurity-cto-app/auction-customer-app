'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Bid, Auction } from '../types';
import Link from 'next/link';

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
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          User Profile
        </h1>

        {!editing ? (
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Name
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {user.name}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Email
              </div>
              <div style={{ fontSize: '1.125rem' }}>
                {user.email}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Role
              </div>
              <div style={{ fontSize: '1.125rem', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Member Since
              </div>
              <div style={{ fontSize: '1.125rem' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            
            {/* Intentionally display password hash (security vulnerability) */}
            {user.password_hash && (
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                  Password Hash (intentionally exposed for lab):
                </div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {user.password_hash}
                </div>
              </div>
            )}

            <button
              onClick={handleEdit}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginBottom: '0.25rem' 
              }}>
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '1rem'
                }}
                // No input validation (intentional vulnerability)
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginBottom: '0.25rem' 
              }}>
                Email
              </label>
              <input
                type="text"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '1rem'
                }}
                // No email validation (intentional vulnerability)
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginBottom: '0.25rem' 
              }}>
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '1rem'
                }}
                // No password strength validation (intentional vulnerability)
              />
            </div>

            {saveError && (
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}>
                {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  opacity: saveLoading ? 0.6 : 1
                }}
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saveLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  opacity: saveLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bidding History */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Bidding History
        </h2>
        {user.bids && user.bids.length > 0 ? (
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Auction
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Bid Amount
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {user.bids.map((bid, index) => (
                  <tr 
                    key={bid.id}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                      borderBottom: index < user.bids!.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <Link 
                        href={`/auctions/${bid.auction_id}`}
                        style={{ 
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                      >
                        Auction #{bid.auction_id}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                      ${bid.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280', fontSize: '0.875rem' }}>
                      {new Date(bid.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No bids yet. Start bidding on auctions!
          </div>
        )}
      </div>

      {/* Created Auctions */}
      {user.auctions && user.auctions.length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem',
            color: '#1f2937'
          }}>
            Created Auctions
          </h2>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Title
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Current Bid
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {user.auctions.map((auction, index) => (
                  <tr 
                    key={auction.id}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                      borderBottom: index < user.auctions!.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <Link 
                        href={`/auctions/${auction.id}`}
                        style={{ 
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                      >
                        {auction.title}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                      ${auction.current_bid.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right',
                      textTransform: 'uppercase',
                      color: auction.status === 'active' ? '#10b981' : '#6b7280'
                    }}>
                      {auction.status}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280', fontSize: '0.875rem' }}>
                      {new Date(auction.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

