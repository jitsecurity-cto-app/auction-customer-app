'use client';

import { useState, useEffect } from 'react';
import { getAuthUser, isAuthenticated, logout } from '../lib/auth';
import { Navbar as DesignSystemNavbar, Button } from '@design-system/components';
import Link from 'next/link';

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [mounted, setMounted] = useState(false);

  // Only check authentication on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUser(getAuthUser());
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (!mounted) {
    // Return consistent structure on server and client to avoid hydration mismatch
    return (
      <DesignSystemNavbar
        brand="Auction Platform"
        links={[{ href: '/auctions', label: 'Auctions' }]}
        authenticated={false}
      />
    );
  }

  const links = [
    { href: '/auctions', label: 'Auctions' },
    ...(authenticated ? [
      { href: '/auctions/new', label: 'Create Auction' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/profile', label: 'Profile' },
    ] : []),
  ];

  const rightContent = !authenticated ? (
    <Link href="/login">
      <Button variant="primary" size="sm">
        Login
      </Button>
    </Link>
  ) : undefined;

  return (
    <DesignSystemNavbar
      brand="Auction Platform"
      links={links}
      authenticated={authenticated}
      user={user || undefined}
      onLogout={handleLogout}
      rightContent={rightContent}
    />
  );
}

