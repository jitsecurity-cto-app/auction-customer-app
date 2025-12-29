import { render, screen } from '@testing-library/react';
import Navbar from '../../../src/components/Navbar';
import { getAuthUser, isAuthenticated, logout } from '../../../src/lib/auth';

// Mock dependencies
jest.mock('../../../src/lib/auth');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.location as any).href = '';
  });

  it('should render navigation links', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<Navbar />);

    expect(screen.getByText('Auction Platform')).toBeInTheDocument();
    expect(screen.getByText('Auctions')).toBeInTheDocument();
  });

  it('should show login and register links when not authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<Navbar />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should show user info and logout when authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });

    render(<Navbar />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should handle logout', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    expect(logout).toHaveBeenCalled();
  });
});

