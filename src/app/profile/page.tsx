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
      <div className="flex flex-col items-center justify-center py-24">
        <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Profile</h1>
        <p className="text-sm text-slate-500 mb-6">
          You must be logged in to view your profile.
        </p>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Link
            href="/login"
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Register
          </Link>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-sm text-amber-800">
            <strong>IDOR Vulnerability:</strong> You can access any user&apos;s profile by adding <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">?id=USER_ID</code> to the URL.
            No authorization checks are performed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* IDOR vulnerability notice (for lab purposes) */}
      {searchParams.get('id') && searchParams.get('id') !== getAuthUser()?.id && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">
              <strong>IDOR Vulnerability Active:</strong> You are viewing another user&apos;s profile.
              No authorization check was performed. You can edit this profile.
            </p>
          </div>
        </div>
      )}
      <UserProfile userId={userId} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24">
        <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-slate-500 mt-4">Loading...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
