'use client';

import { getAuthUser, isAuthenticated, logout } from '../lib/auth';
import { Navbar as DesignSystemNavbar, Button } from '@design-system/components';
import Link from 'next/link';

export default function Navbar() {
  const user = getAuthUser();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

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

