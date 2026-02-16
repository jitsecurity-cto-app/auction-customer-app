import { render, screen, waitFor } from '@testing-library/react';
import BidHistory from '../../../src/components/BidHistory';
import { api } from '../../../src/lib/api';

// Mock the API
jest.mock('../../../src/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('BidHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<BidHistory auctionId="1" />);
    expect(screen.getByText('Loading bid history...')).toBeInTheDocument();
  });

  it('should display bids after loading', async () => {
    const mockBids = [
      {
        id: 'bid1',
        auction_id: '1',
        user_id: 'user1',
        amount: 150,
        created_at: new Date().toISOString(),
        user: {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
        },
      },
      {
        id: 'bid2',
        auction_id: '1',
        user_id: 'user2',
        amount: 200,
        created_at: new Date().toISOString(),
        user: {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
        },
      },
    ];

    (api.get as jest.Mock).mockResolvedValue(mockBids);

    render(<BidHistory auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
      // Amounts may appear in both summary and table rows
      expect(screen.getAllByText('$150.00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$200.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to load bids';
    (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<BidHistory auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should display no bids message when empty', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    render(<BidHistory auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('No bids yet. Be the first to bid!')).toBeInTheDocument();
    });
  });

  it('should not validate auctionId (vulnerability)', async () => {
    (api.get as jest.Mock).mockResolvedValue([]);

    // Should accept any auctionId without validation
    render(<BidHistory auctionId="1' OR '1'='1" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/auctions/1' OR '1'='1/bids"
      );
    });
  });
});

