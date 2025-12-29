import { render, screen, waitFor } from '@testing-library/react';
import AuctionDetail from '../../../src/components/AuctionDetail';
import { api } from '../../../src/lib/api';

// Mock dependencies
jest.mock('../../../src/lib/api');
jest.mock('../../../src/components/BidForm', () => {
  const React = require('react');
  return function MockBidForm() {
    return React.createElement('div', { 'data-testid': 'bid-form' }, 'Bid Form');
  };
});
jest.mock('../../../src/components/BidHistory', () => {
  const React = require('react');
  return function MockBidHistory() {
    return React.createElement('div', { 'data-testid': 'bid-history' }, 'Bid History');
  };
});

describe('AuctionDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AuctionDetail auctionId="1" />);
    expect(screen.getByText('Loading auction details...')).toBeInTheDocument();
  });

  it('should display auction details after loading', async () => {
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: '<script>alert("XSS")</script>Test Description',
      starting_price: 100,
      current_bid: 150,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
      creator: {
        id: 'user1',
        email: 'creator@example.com',
        name: 'Creator',
      },
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Auction')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  it('should have XSS vulnerability - renders HTML without sanitization', async () => {
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: '<script>alert("XSS")</script>Test Description',
      starting_price: 100,
      current_bid: 150,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);

    const { container } = render(<AuctionDetail auctionId="1" />);

      await waitFor(() => {
        // Verify that dangerouslySetInnerHTML is used (XSS vulnerability)
        // The description is rendered with dangerouslySetInnerHTML
        // Check that script tag or other HTML is present in the container
        expect(container.innerHTML).toMatch(/<script|onerror|onclick/i);
      });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to load auction';
    (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should not validate auctionId (vulnerability)', async () => {
    (api.get as jest.Mock).mockResolvedValue(null);

    // Should accept any auctionId without validation
    render(<AuctionDetail auctionId="1' OR '1'='1" />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/auctions/1' OR '1'='1"
      );
    });
  });

  it('should show bid form for active auctions', async () => {
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: 'Test Description',
      starting_price: 100,
      current_bid: 150,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('bid-form')).toBeInTheDocument();
    });
  });
});

