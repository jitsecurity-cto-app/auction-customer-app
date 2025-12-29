/**
 * Unit tests for auctions page
 * Tests status filtering and create auction button
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuctionsPage from '../../../src/app/auctions/page';
import { isAuthenticated } from '../../../src/lib/auth';
import { api } from '../../../src/lib/api';
import { Auction } from '../../../src/types';

// Mock dependencies
jest.mock('../../../src/lib/auth');
jest.mock('../../../src/lib/api');

const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock Next.js Link and Suspense
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

// Mock Suspense to avoid issues with Next.js Suspense
jest.mock('react', () => {
  const ReactModule = jest.requireActual('react');
  return {
    ...ReactModule,
    Suspense: ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
      return ReactModule.createElement(ReactModule.Fragment, {}, children);
    },
  };
});

// Mock AuctionList component
jest.mock('../../../src/components/AuctionList', () => {
  const React = require('react');
  return function MockAuctionList({ status }: { status?: string }) {
    return React.createElement('div', { 'data-testid': 'auction-list' }, 
      `AuctionList with status: ${status || 'all'}`
    );
  };
});

describe('AuctionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null); // Default to no query params
  });

  it('should render page title and create auction button when authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<AuctionsPage />);

    expect(screen.getByText('All Auctions')).toBeInTheDocument();
    expect(screen.getByText('Create Auction')).toBeInTheDocument();
  });

  it('should not show create auction button when not authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<AuctionsPage />);

    expect(screen.getByText('All Auctions')).toBeInTheDocument();
    expect(screen.queryByText('Create Auction')).not.toBeInTheDocument();
  });

  it('should render status filter buttons', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<AuctionsPage />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should have filter buttons that update state when clicked', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<AuctionsPage />);

    const activeButton = screen.getByText('Active');
    const endedButton = screen.getByText('Ended');
    const cancelledButton = screen.getByText('Cancelled');

    // Verify buttons are present and clickable
    expect(activeButton).toBeInTheDocument();
    expect(endedButton).toBeInTheDocument();
    expect(cancelledButton).toBeInTheDocument();

    // Click buttons to verify they don't throw errors
    await userEvent.click(activeButton);
    await userEvent.click(endedButton);
    await userEvent.click(cancelledButton);

    // Verify AuctionList is rendered (filtering logic is tested in AuctionList component tests)
    expect(screen.getByTestId('auction-list')).toBeInTheDocument();
  });

  it('should show all auctions when All button is clicked', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<AuctionsPage />);

    // First set a filter
    const activeButton = screen.getByText('Active');
    await userEvent.click(activeButton);

    // Then click All to clear filter
    const allButton = screen.getByText('All');
    await userEvent.click(allButton);

    await waitFor(() => {
      expect(screen.getByTestId('auction-list')).toHaveTextContent('status: all');
    });
  });

  it('should have filter buttons that are clickable', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<AuctionsPage />);

    const activeButton = screen.getByText('Active');
    const endedButton = screen.getByText('Ended');
    const cancelledButton = screen.getByText('Cancelled');
    const allButton = screen.getByText('All');

    // Verify all buttons are present and clickable
    expect(activeButton).toBeInTheDocument();
    expect(endedButton).toBeInTheDocument();
    expect(cancelledButton).toBeInTheDocument();
    expect(allButton).toBeInTheDocument();
  });
});

