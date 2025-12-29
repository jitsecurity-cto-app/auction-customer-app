'use client';

import { getAuthUser, isAuthenticated, logout } from '../lib/auth';
import { Navbar as DesignSystemNavbar } from '@design-system/components';

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
      { href: '/profile', label: 'Profile' },
    ] : []),
  ];

  return (
    <DesignSystemNavbar
      brand="Auction Platform"
      links={links}
      authenticated={authenticated}
      user={user || undefined}
      onLogout={handleLogout}
    />
  );
}

