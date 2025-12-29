'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import UserProfile from '@/components/UserProfile';
import Link from 'next/link';
import { Button, Card } from '@design-system/components';
import styles from './page.module.css';

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
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={styles.notLoggedIn}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.message}>
          You must be logged in to view your profile.
        </p>
        <div className={styles.actions}>
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Register</Button>
          </Link>
        </div>
        <Card variant="outlined" padding="md" className={styles.warningCard}>
          <p className={styles.warningText}>
            <strong>IDOR Vulnerability:</strong> You can access any user's profile by adding <code>?id=USER_ID</code> to the URL.
            No authorization checks are performed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* IDOR vulnerability notice (for lab purposes) */}
      {searchParams.get('id') && searchParams.get('id') !== getAuthUser()?.id && (
        <Card variant="outlined" padding="md" className={styles.vulnerabilityNotice}>
          <p className={styles.vulnerabilityText}>
            <strong>IDOR Vulnerability Active:</strong> You are viewing another user's profile. 
            No authorization check was performed. You can edit this profile.
          </p>
        </Card>
      )}
      <UserProfile userId={userId} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

