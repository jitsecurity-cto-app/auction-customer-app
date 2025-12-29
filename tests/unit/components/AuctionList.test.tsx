import { render, screen, waitFor } from '@testing-library/react';
import AuctionList from '../../../src/components/AuctionList';
import { api } from '../../../src/lib/api';
import { Auction } from '../../../src/types';

// Mock the API
jest.mock('../../../src/lib/api', () => ({
  api: {
    get: jest.fn(),
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
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
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

    (api.get as jest.Mock).mockResolvedValue(mockAuctions);

    render(<AuctionList />);

    await waitFor(() => {
      expect(screen.getByText('Auction 1')).toBeInTheDocument();
      expect(screen.getByText('Auction 2')).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to fetch auctions';
    (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<AuctionList />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should display no auctions message when empty', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    render(<AuctionList />);

    await waitFor(() => {
      expect(screen.getByText('No auctions found.')).toBeInTheDocument();
    });
  });

  it('should filter by status when provided', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    render(<AuctionList status="active" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('status=active')
      );
    });
  });

  it('should use limit parameter', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    render(<AuctionList limit={10} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=10')
      );
    });
  });
});

