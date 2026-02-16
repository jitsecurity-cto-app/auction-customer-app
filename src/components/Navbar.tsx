'use client';

import { useState, useEffect } from 'react';
import { getAuthUser, isAuthenticated, logout } from '../lib/auth';
import Link from 'next/link';

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const links = [
    { href: '/auctions', label: 'Auctions' },
    ...(mounted && authenticated ? [
      { href: '/auctions/new', label: 'Create Auction' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/orders', label: 'Orders' },
      { href: '/profile', label: 'Profile' },
    ] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo/Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">A</div>
            <span className="text-lg font-bold text-slate-900">Auction</span>
          </Link>

          {/* Center: Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Auth buttons or user menu */}
          <div className="flex items-center gap-3">
            {mounted && !authenticated && (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
            {mounted && authenticated && user && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">
                  {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {mounted && !authenticated && (
              <div className="flex gap-2 px-3 pt-2">
                <Link
                  href="/login"
                  className="flex-1 text-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 text-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
            {mounted && authenticated && user && (
              <div className="px-3 pt-2 space-y-2">
                <span className="block text-sm text-slate-500">{user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
