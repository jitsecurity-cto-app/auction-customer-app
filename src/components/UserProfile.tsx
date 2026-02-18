'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Bid, Auction, Dispute } from '../types';
import Link from 'next/link';
import { formatCurrency, formatDate, formatDateTime } from '@design-system/utils';

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
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);

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

  const fetchDisputes = async () => {
    // No authorization check - IDOR vulnerability (can see any user's disputes)
    try {
      setDisputesLoading(true);
      // Fetch all disputes, then filter for those filed by the current user
      // No authorization check - intentional vulnerability (can see all disputes)
      const allDisputes = await api.getDisputes();
      // Filter for disputes filed by this user
      const userDisputes = allDisputes.filter(d => String(d.filed_by) === String(userId));
      // Only show active disputes (open or in_review)
      const activeDisputes = userDisputes.filter(d => d.status === 'open' || d.status === 'in_review');
      setDisputes(activeDisputes);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      // Silently fail - disputes are optional
    } finally {
      setDisputesLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
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
      <div className="flex flex-col items-center justify-center py-24">
        <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-slate-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">User Profile</h1>

        {!editing ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xl">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Role</div>
                  <div className="text-sm font-medium text-slate-700 capitalize">{user.role}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Member Since</div>
                  <div className="text-sm font-medium text-slate-700">{formatDate(user.created_at)}</div>
                </div>
              </div>

              {/* Intentionally display password hash (security vulnerability) */}
              {user.password_hash && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <div className="text-xs font-medium text-amber-700 mb-1">
                    Password Hash (intentionally exposed for lab):
                  </div>
                  <code className="text-xs text-amber-800 break-all">
                    {user.password_hash}
                  </code>
                </div>
              )}

              <button
                onClick={handleEdit}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  // No input validation (intentional vulnerability)
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="text"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  // No email validation (intentional vulnerability)
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  // No password strength validation (intentional vulnerability)
                />
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm" role="alert">
                  {saveError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saveLoading}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bidding History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Bidding History</h2>
        {user.bids && user.bids.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Auction</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Bid Amount</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {user.bids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/auctions/${bid.auction_id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                          Auction #{bid.auction_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(bid.amount || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-slate-500">{formatDateTime(bid.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <p className="text-sm text-slate-500">No bids yet. Start bidding on auctions!</p>
          </div>
        )}
      </div>

      {/* Created Auctions */}
      {user.auctions && user.auctions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Created Auctions</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Title</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Current Bid</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {user.auctions.map((auction) => (
                    <tr key={auction.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/auctions/${auction.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                          {auction.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(auction.current_bid || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${auction.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {auction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-slate-500">{formatDate(auction.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Active Disputes - No auth check, IDOR vulnerability (can see any user's disputes) */}
      <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Disputes</h2>
          {disputesLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
              <p className="text-sm text-slate-500">Loading disputes...</p>
            </div>
          ) : disputes.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Auction</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Reason</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Filed</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {disputes.map((dispute) => (
                      <tr key={dispute.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {dispute.auction ? (
                            <Link href={`/auctions/${dispute.auction_id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                              {dispute.auction.title || `Auction #${dispute.auction_id}`}
                            </Link>
                          ) : (
                            <Link href={`/auctions/${dispute.auction_id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                              Auction #{dispute.auction_id}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-600">
                            {dispute.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            dispute.status === 'open'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : dispute.status === 'in_review'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {dispute.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-slate-500">{formatDate(dispute.created_at)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/auctions/${dispute.auction_id}`}
                            className="inline-flex bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                          >
                            View Auction
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
              <p className="text-sm text-slate-500">No active disputes.</p>
            </div>
          )}
        </div>
    </div>
  );
}
