/**
 * Unit tests for homepage
 * Tests navigation links and auction display
 */

import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '../../../src/app/page';
import { isAuthenticated } from '../../../src/lib/auth';

// Mock dependencies
jest.mock('../../../src/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

// Mock AuctionList component
jest.mock('../../../src/components/AuctionList', () => {
  const React = require('react');
  return function MockAuctionList({ status, limit }: { status?: string; limit?: number }) {
    return React.createElement('div', { 'data-testid': 'auction-list' }, 
      `AuctionList with status: ${status || 'all'}, limit: ${limit || 50}`
    );
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page title and welcome message', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<HomePage />);

    expect(screen.getByText('Auction Platform')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the auction platform/i)).toBeInTheDocument();
  });

  it('should show navigation links to filter auctions', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<HomePage />);

    expect(screen.getByText('View All Active')).toBeInTheDocument();
    expect(screen.getByText('View Ended')).toBeInTheDocument();
    expect(screen.getByText('View All Auctions')).toBeInTheDocument();
  });

  it('should show create auction button when authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<HomePage />);

    expect(screen.getByText('Create Auction')).toBeInTheDocument();
  });

  it('should not show create auction button when not authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<HomePage />);

    expect(screen.queryByText('Create Auction')).not.toBeInTheDocument();
  });

  it('should display active auctions section', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<HomePage />);

    expect(screen.getByText('Active Auctions')).toBeInTheDocument();
  });

  it('should render AuctionList with active status and limit', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<HomePage />);

    expect(screen.getByTestId('auction-list')).toHaveTextContent('status: active');
    expect(screen.getByTestId('auction-list')).toHaveTextContent('limit: 12');
  });

  it('should have correct hrefs for navigation links', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<HomePage />);

    const viewAllActiveLink = screen.getByText('View All Active').closest('a');
    expect(viewAllActiveLink).toHaveAttribute('href', '/auctions?status=active');

    const viewEndedLink = screen.getByText('View Ended').closest('a');
    expect(viewEndedLink).toHaveAttribute('href', '/auctions?status=ended');

    const viewAllLink = screen.getByText('View All Auctions').closest('a');
    expect(viewAllLink).toHaveAttribute('href', '/auctions');
  });

  it('should have create auction link when authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<HomePage />);

    const createLink = screen.getByText('Create Auction').closest('a');
    expect(createLink).toHaveAttribute('href', '/auctions/new');
  });
});

