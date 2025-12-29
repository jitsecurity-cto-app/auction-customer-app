'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import UserProfile from '@/components/UserProfile';
import Link from 'next/link';

function ProfileContent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // IDOR vulnerability: Allow accessing any user profile by ID via query parameter
    // No authorization check - anyone can view/edit any user's profile
    const userIdParam = searchParams.get('id');
    const currentUser = getAuthUser();

    if (userIdParam) {
      // No validation of userIdParam (intentional vulnerability)
      // No authorization check (IDOR vulnerability)
      setUserId(userIdParam);
    } else if (currentUser) {
      setUserId(currentUser.id);
    } else {
      setUserId(null);
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Profile
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          You must be logged in to view your profile.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/login"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.25rem'
            }}
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.25rem'
            }}
          >
            Register
          </Link>
        </div>
        <div style={{ 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          <strong>IDOR Vulnerability:</strong> You can access any user's profile by adding <code>?id=USER_ID</code> to the URL.
          No authorization checks are performed.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* IDOR vulnerability notice (for lab purposes) */}
      {searchParams.get('id') && searchParams.get('id') !== getAuthUser()?.id && (
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderBottom: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '0.875rem'
        }}>
          <strong>IDOR Vulnerability Active:</strong> You are viewing another user's profile. 
          No authorization check was performed. You can edit this profile.
        </div>
      )}
      <UserProfile userId={userId} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

