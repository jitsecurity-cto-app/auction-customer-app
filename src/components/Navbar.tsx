'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAuthUser, isAuthenticated, logout } from '../lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const user = getAuthUser();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav style={{ 
      padding: '1rem 2rem', 
      backgroundColor: '#f3f4f6', 
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link href="/" style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          textDecoration: 'none',
          color: '#1f2937'
        }}>
          Auction Platform
        </Link>
        <Link 
          href="/auctions" 
          style={{ 
            textDecoration: 'none',
            color: pathname === '/auctions' ? '#3b82f6' : '#6b7280',
            fontWeight: pathname === '/auctions' ? 'bold' : 'normal'
          }}
        >
          Auctions
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {authenticated ? (
          <>
            <span style={{ color: '#6b7280' }}>
              {user?.name || user?.email}
            </span>
            <Link 
              href="/profile" 
              style={{ 
                textDecoration: 'none',
                color: pathname === '/profile' ? '#3b82f6' : '#6b7280'
              }}
            >
              Profile
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              href="/login" 
              style={{ 
                textDecoration: 'none',
                color: pathname === '/login' ? '#3b82f6' : '#6b7280'
              }}
            >
              Login
            </Link>
            <Link 
              href="/register" 
              style={{ 
                textDecoration: 'none',
                color: pathname === '/register' ? '#3b82f6' : '#6b7280'
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

