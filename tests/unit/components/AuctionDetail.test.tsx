import { render, screen, waitFor } from '@testing-library/react';
import AuctionDetail from '../../../src/components/AuctionDetail';
import { api } from '../../../src/lib/api';
import { getAuthUser } from '../../../src/lib/auth';

// Mock dependencies
jest.mock('../../../src/lib/api');
jest.mock('../../../src/lib/auth');

const mockUsePathname = jest.fn().mockReturnValue('/auctions/1');
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));
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
jest.mock('../../../src/components/WorkflowVisualization', () => {
  const React = require('react');
  return function MockWorkflowVisualization({ currentState }: { currentState: string }) {
    return React.createElement('div', { 'data-testid': 'workflow-visualization' }, `Workflow: ${currentState}`);
  };
});
jest.mock('../../../src/components/phases/ActiveBiddingPhase', () => {
  const React = require('react');
  return function MockActiveBiddingPhase() {
    return React.createElement('div', { 'data-testid': 'active-bidding-phase' }, 'Active Bidding Phase');
  };
});
jest.mock('../../../src/components/phases/PendingSalePhase', () => {
  const React = require('react');
  return function MockPendingSalePhase() {
    return React.createElement('div', { 'data-testid': 'pending-sale-phase' }, 'Pending Sale Phase');
  };
});
jest.mock('../../../src/components/phases/ShippedPhase', () => {
  const React = require('react');
  return function MockShippedPhase() {
    return React.createElement('div', { 'data-testid': 'shipped-phase' }, 'Shipped Phase');
  };
});
jest.mock('../../../src/components/phases/CompletePhase', () => {
  const React = require('react');
  return function MockCompletePhase() {
    return React.createElement('div', { 'data-testid': 'complete-phase' }, 'Complete Phase');
  };
});

describe('AuctionDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockReturnValue({ id: 'user1', email: 'user@example.com', name: 'Test User', role: 'user' });
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
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should resolve placeholder ID from URL pathname for static export', async () => {
    // Simulate static export: CloudFront rewrites /auctions/7/ to /auctions/placeholder/
    // The component receives 'placeholder' but the browser URL is /auctions/7
    mockUsePathname.mockReturnValue('/auctions/7');

    const mockAuction = {
      id: '7',
      title: 'Auction Seven',
      description: 'Real auction',
      starting_price: 200,
      current_bid: 300,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);

    render(<AuctionDetail auctionId="placeholder" />);

    await waitFor(() => {
      // Verify API was called with the real ID from the URL, not 'placeholder'
      expect(api.get).toHaveBeenCalledWith('/auctions/7');
    });

    await waitFor(() => {
      expect(screen.getByText('Auction Seven')).toBeInTheDocument();
    });

    // Reset mock
    mockUsePathname.mockReturnValue('/auctions/1');
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
      workflow_state: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('workflow-visualization')).toBeInTheDocument();
      expect(screen.getByTestId('active-bidding-phase')).toBeInTheDocument();
    });
  });

  it('should display workflow visualization', async () => {
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: 'Test Description',
      starting_price: 100,
      current_bid: 150,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      workflow_state: 'pending_sale',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('workflow-visualization')).toBeInTheDocument();
      expect(screen.getByText(/Workflow: pending_sale/)).toBeInTheDocument();
    });
  });

  it('should show pending sale phase when workflow state is pending_sale', async () => {
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: 'Test Description',
      starting_price: 100,
      current_bid: 150,
      end_time: new Date(Date.now() - 86400000).toISOString(),
      status: 'ended',
      workflow_state: 'pending_sale',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);
    (api.getDisputes as jest.Mock).mockResolvedValue([]);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('pending-sale-phase')).toBeInTheDocument();
    });
  });

  it('should display dispute notice when active disputes exist', async () => {
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
      creator: {
        id: 'user1',
        email: 'creator@example.com',
        name: 'Creator',
      },
    };

    const mockDisputes = [
      {
        id: '1',
        auction_id: '1',
        filed_by: 'user2',
        filed_by_role: 'buyer',
        reason: 'Item not as described',
        status: 'open',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
    ];

    (api.get as jest.Mock).mockResolvedValue(mockAuction);
    (api.getDisputes as jest.Mock).mockResolvedValue(mockDisputes);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Dispute Pending')).toBeInTheDocument();
      expect(screen.getByText(/A dispute has been opened for this auction/i)).toBeInTheDocument();
      expect(screen.getByText(/Item not as described/i)).toBeInTheDocument();
    });
  });

  it('should display multiple disputes notice when multiple disputes exist', async () => {
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
      creator: {
        id: 'user1',
        email: 'creator@example.com',
        name: 'Creator',
      },
    };

    const mockDisputes = [
      {
        id: '1',
        auction_id: '1',
        filed_by: 'user2',
        filed_by_role: 'buyer',
        reason: 'First dispute',
        status: 'open',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
      {
        id: '2',
        auction_id: '1',
        filed_by: 'user3',
        filed_by_role: 'seller',
        reason: 'Second dispute',
        status: 'in_review',
        created_at: '2024-01-11T00:00:00Z',
        updated_at: '2024-01-11T00:00:00Z',
      },
    ];

    (api.get as jest.Mock).mockResolvedValue(mockAuction);
    (api.getDisputes as jest.Mock).mockResolvedValue(mockDisputes);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Dispute Pending')).toBeInTheDocument();
      expect(screen.getByText(/2 disputes have been opened/i)).toBeInTheDocument();
    });
  });

  it('should not display dispute notice when no active disputes exist', async () => {
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
      creator: {
        id: 'user1',
        email: 'creator@example.com',
        name: 'Creator',
      },
    };

    (api.get as jest.Mock).mockResolvedValue(mockAuction);
    (api.getDisputes as jest.Mock).mockResolvedValue([]);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Auction')).toBeInTheDocument();
    });

    expect(screen.queryByText('Dispute Pending')).not.toBeInTheDocument();
  });

  it('should filter to show only active disputes (open or in_review)', async () => {
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
      creator: {
        id: 'user1',
        email: 'creator@example.com',
        name: 'Creator',
      },
    };

    const mockDisputes = [
      {
        id: '1',
        auction_id: '1',
        filed_by: 'user2',
        filed_by_role: 'buyer',
        reason: 'Active dispute',
        status: 'open',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
      {
        id: '2',
        auction_id: '1',
        filed_by: 'user3',
        filed_by_role: 'seller',
        reason: 'Resolved dispute',
        status: 'resolved',
        created_at: '2024-01-09T00:00:00Z',
        updated_at: '2024-01-12T00:00:00Z',
      },
    ];

    (api.get as jest.Mock).mockResolvedValue(mockAuction);
    (api.getDisputes as jest.Mock).mockResolvedValue(mockDisputes);

    render(<AuctionDetail auctionId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Dispute Pending')).toBeInTheDocument();
      expect(screen.getByText(/A dispute has been opened/i)).toBeInTheDocument();
      expect(screen.getByText(/Active dispute/i)).toBeInTheDocument();
    });
  });
});

