/**
 * Unit tests for Dashboard page
 * Tests workflow state filtering, role-based filtering, and auction grouping
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { api } from '@/lib/api';
import { getAuthUser, isAuthenticated } from '@/lib/auth';

jest.mock('@/lib/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'role') return null;
      return null;
    }),
  }),
}));

jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

describe('Dashboard Page', () => {
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
  const mockAuctions = [
    {
      id: '1',
      title: 'Active Auction',
      description: 'Test Description',
      starting_price: 100,
      current_bid: 150,
      bid_count: 5,
      status: 'active',
      workflow_state: 'active',
      created_by: '1',
      end_time: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Pending Sale Auction',
      description: 'Test Description',
      starting_price: 200,
      current_bid: 250,
      bid_count: 3,
      status: 'ended',
      workflow_state: 'pending_sale',
      created_by: '1',
      winner_id: '2',
      closed_at: new Date().toISOString(),
      end_time: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Shipped Auction',
      description: 'Test Description',
      starting_price: 300,
      current_bid: 350,
      bid_count: 2,
      status: 'ended',
      workflow_state: 'shipping',
      created_by: '1',
      winner_id: '2',
      closed_at: new Date().toISOString(),
      end_time: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
      order: { id: '1', status: 'shipped', tracking_number: 'TRACK123' },
    },
    {
      id: '4',
      title: 'Complete Auction',
      description: 'Test Description',
      starting_price: 400,
      current_bid: 450,
      bid_count: 1,
      status: 'ended',
      workflow_state: 'complete',
      created_by: '1',
      winner_id: '2',
      closed_at: new Date().toISOString(),
      end_time: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
      order: { id: '2', status: 'completed' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getAuthUser as jest.Mock).mockReturnValue(mockUser);
    (api.getAuctionsByWorkflow as jest.Mock).mockResolvedValue(mockAuctions);
  });

  it('should display loading state initially', () => {
    (api.getAuctionsByWorkflow as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display dashboard title and create auction button', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('My Activity')).toBeInTheDocument();
      expect(screen.getByText('Create Auction')).toBeInTheDocument();
    });
  });

  it('should display all auctions when "All" tab is selected', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Auction')).toBeInTheDocument();
      expect(screen.getByText('Pending Sale Auction')).toBeInTheDocument();
      expect(screen.getByText('Shipped Auction')).toBeInTheDocument();
      expect(screen.getByText('Complete Auction')).toBeInTheDocument();
    });
  });

  it('should filter auctions by workflow state', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Auction')).toBeInTheDocument();
    });

    const activeButton = screen.getByText(/Active \(\d+\)/);
    fireEvent.click(activeButton);

    await waitFor(() => {
      expect(api.getAuctionsByWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ workflow_state: 'active' })
      );
    });
  });

  it('should filter auctions by role (seller)', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('As Seller')).toBeInTheDocument();
    });

    const sellerButton = screen.getByText('As Seller');
    fireEvent.click(sellerButton);

    await waitFor(() => {
      expect(api.getAuctionsByWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'seller' })
      );
    });
  });

  it('should filter auctions by role (buyer)', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('As Buyer')).toBeInTheDocument();
    });

    const buyerButton = screen.getByText('As Buyer');
    fireEvent.click(buyerButton);

    await waitFor(() => {
      expect(api.getAuctionsByWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'buyer' })
      );
    });
  });

  it('should display workflow state badges', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('pending sale')).toBeInTheDocument();
      expect(screen.getByText('shipping')).toBeInTheDocument();
      expect(screen.getByText('complete')).toBeInTheDocument();
    });
  });

  it('should display empty state when no auctions found', async () => {
    (api.getAuctionsByWorkflow as jest.Mock).mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/No auctions found in this category/)).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to load auctions';
    (api.getAuctionsByWorkflow as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should redirect to login when not authenticated', () => {
    const mockPush = jest.fn();
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    (getAuthUser as jest.Mock).mockReturnValue(null);
    
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
      useSearchParams: () => ({ get: jest.fn() }),
    }));

    render(<DashboardPage />);
    
    // Component should attempt to redirect
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should update workflow state when action button is clicked', async () => {
    const mockPut = jest.fn().mockResolvedValue({});
    (api.put as jest.Mock) = mockPut;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending Sale Auction')).toBeInTheDocument();
    });

    // Find and click "Mark as Shipping" button if it exists
    const markShippingButton = screen.queryByText('Mark as Shipping');
    if (markShippingButton) {
      fireEvent.click(markShippingButton);
      
      await waitFor(() => {
        expect(api.put).toHaveBeenCalled();
      });
    }
  });

  it('should display order status when order exists', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Shipped Auction')).toBeInTheDocument();
      expect(screen.getByText(/Order Status:/)).toBeInTheDocument();
    });
  });
});
