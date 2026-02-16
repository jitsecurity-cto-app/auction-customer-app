import { render, screen, waitFor } from '@testing-library/react';
import AuctionList from '../../../src/components/AuctionList';
import { api } from '../../../src/lib/api';
import { Auction } from '../../../src/types';

// Mock the API
jest.mock('../../../src/lib/api', () => ({
  api: {
    getAuctions: jest.fn(),
  },
}));

// Mock AuctionCard
jest.mock('../../../src/components/AuctionCard', () => {
  const React = require('react');
  return function MockAuctionCard({ auction }: { auction: Auction }) {
    return React.createElement('div', { 'data-testid': 'auction-card' }, auction.title);
  };
});

describe('AuctionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (api.getAuctions as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AuctionList />);
    expect(screen.getByText('Loading auctions...')).toBeInTheDocument();
  });

  it('should display auctions after loading', async () => {
    const mockAuctions: Auction[] = [
      {
        id: '1',
        title: 'Auction 1',
        description: 'Description 1',
        starting_price: 100,
        current_bid: 150,
        end_time: new Date().toISOString(),
        status: 'active',
        created_by: 'user1',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Auction 2',
        description: 'Description 2',
        starting_price: 200,
        current_bid: 250,
        end_time: new Date().toISOString(),
        status: 'active',
        created_by: 'user2',
        created_at: new Date().toISOString(),
      },
    ];

    (api.getAuctions as jest.Mock).mockResolvedValue(mockAuctions);

    render(<AuctionList />);

    await waitFor(() => {
      expect(screen.getByText('Auction 1')).toBeInTheDocument();
      expect(screen.getByText('Auction 2')).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to fetch auctions';
    (api.getAuctions as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<AuctionList />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should display no auctions message when empty', async () => {
    (api.getAuctions as jest.Mock).mockResolvedValue([]);

    render(<AuctionList />);

    await waitFor(() => {
      expect(screen.getByText('No auctions found.')).toBeInTheDocument();
    });
  });

  it('should fetch all auctions and filter client-side for active status', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago

    const mockAuctions: Auction[] = [
      {
        id: '1',
        title: 'Active Auction',
        description: 'Still running',
        starting_price: 100,
        current_bid: 150,
        end_time: futureDate,
        status: 'active',
        created_by: 'user1',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Expired Auction',
        description: 'Time passed but status still active',
        starting_price: 200,
        current_bid: 250,
        end_time: pastDate,
        status: 'active',
        created_by: 'user2',
        created_at: new Date().toISOString(),
      },
    ];

    (api.getAuctions as jest.Mock).mockResolvedValue(mockAuctions);

    render(<AuctionList status="active" />);

    await waitFor(() => {
      // Should fetch all auctions (no status sent to API) for client-side filtering
      expect(api.getAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined })
      );
    });

    // Only the truly active auction (with future end_time) should be shown
    await waitFor(() => {
      expect(screen.getByText('Active Auction')).toBeInTheDocument();
      expect(screen.queryByText('Expired Auction')).not.toBeInTheDocument();
    });
  });

  it('should fetch all auctions and filter client-side for ended status', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    const mockAuctions: Auction[] = [
      {
        id: '1',
        title: 'Active Auction',
        description: 'Still running',
        starting_price: 100,
        current_bid: 150,
        end_time: futureDate,
        status: 'active',
        created_by: 'user1',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Time-Expired Auction',
        description: 'Time passed but status still active in DB',
        starting_price: 200,
        current_bid: 250,
        end_time: pastDate,
        status: 'active',
        created_by: 'user2',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Formally Ended Auction',
        description: 'Status is ended in DB',
        starting_price: 300,
        current_bid: 350,
        end_time: pastDate,
        status: 'ended',
        created_by: 'user3',
        created_at: new Date().toISOString(),
      },
    ];

    (api.getAuctions as jest.Mock).mockResolvedValue(mockAuctions);

    render(<AuctionList status="ended" />);

    await waitFor(() => {
      // Should fetch all auctions (no status sent to API) for client-side filtering
      expect(api.getAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined })
      );
    });

    // Both time-expired and formally ended auctions should be shown
    await waitFor(() => {
      expect(screen.queryByText('Active Auction')).not.toBeInTheDocument();
      expect(screen.getByText('Time-Expired Auction')).toBeInTheDocument();
      expect(screen.getByText('Formally Ended Auction')).toBeInTheDocument();
    });
  });

  it('should pass cancelled status directly to API', async () => {
    (api.getAuctions as jest.Mock).mockResolvedValue([]);

    render(<AuctionList status="cancelled" />);

    await waitFor(() => {
      expect(api.getAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      );
    });
  });

  it('should use limit parameter', async () => {
    (api.getAuctions as jest.Mock).mockResolvedValue([]);

    render(<AuctionList limit={10} />);

    await waitFor(() => {
      expect(api.getAuctions).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });
  });
});
