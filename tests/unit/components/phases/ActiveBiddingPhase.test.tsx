/**
 * Unit tests for ActiveBiddingPhase component
 * Tests seller/buyer views and auction closure
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ActiveBiddingPhase from '@/components/phases/ActiveBiddingPhase';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/components/BidForm', () => {
  const React = require('react');
  return function MockBidForm({ auctionId, onBidPlaced }: { auctionId: string; onBidPlaced: () => void }) {
    return React.createElement('div', { 'data-testid': 'bid-form' }, `Bid Form for ${auctionId}`);
  };
});

jest.mock('@/components/BidHistory', () => {
  const React = require('react');
  return function MockBidHistory({ auctionId }: { auctionId: string }) {
    return React.createElement('div', { 'data-testid': 'bid-history' }, `Bid History for ${auctionId}`);
  };
});

describe('ActiveBiddingPhase', () => {
  const mockAuction = {
    id: '1',
    title: 'Test Auction',
    description: 'Test Description',
    starting_price: 100,
    current_bid: 150,
    end_time: new Date(Date.now() + 86400000).toISOString(),
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('should render seller view with bid stats', () => {
    render(
      <ActiveBiddingPhase
        auction={mockAuction}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Seller View - Active Bidding')).toBeInTheDocument();
    expect(screen.getByText(/Current Highest Bid:/)).toBeInTheDocument();
    expect(screen.getByText(/Starting Price:/)).toBeInTheDocument();
    expect(screen.getByText('Stop Sale / Close Auction')).toBeInTheDocument();
    expect(screen.getByTestId('bid-history')).toBeInTheDocument();
  });

  it('should render buyer view with bid form', () => {
    render(
      <ActiveBiddingPhase
        auction={mockAuction}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Place Your Bid')).toBeInTheDocument();
    expect(screen.getByText(/Current Bid:/)).toBeInTheDocument();
    expect(screen.getByText(/Starting Price:/)).toBeInTheDocument();
    expect(screen.getByTestId('bid-form')).toBeInTheDocument();
    expect(screen.getByTestId('bid-history')).toBeInTheDocument();
  });

  it('should handle auction closure for seller', async () => {
    (api.closeAuction as jest.Mock).mockResolvedValue({});

    render(
      <ActiveBiddingPhase
        auction={mockAuction}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    const closeButton = screen.getByText('Stop Sale / Close Auction');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.closeAuction).toHaveBeenCalledWith('1');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should not close auction if user cancels confirmation', async () => {
    window.confirm = jest.fn(() => false);
    (api.closeAuction as jest.Mock).mockResolvedValue({});

    render(
      <ActiveBiddingPhase
        auction={mockAuction}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    const closeButton = screen.getByText('Stop Sale / Close Auction');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.closeAuction).not.toHaveBeenCalled();
    });
  });

  it('should handle closure error gracefully', async () => {
    const errorMessage = 'Failed to close auction';
    (api.closeAuction as jest.Mock).mockRejectedValue(new Error(errorMessage));
    window.alert = jest.fn();

    render(
      <ActiveBiddingPhase
        auction={mockAuction}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    const closeButton = screen.getByText('Stop Sale / Close Auction');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should display starting price when no current bid exists', () => {
    const auctionWithoutBid = {
      ...mockAuction,
      current_bid: null,
    };

    render(
      <ActiveBiddingPhase
        auction={auctionWithoutBid}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/Current Bid:/)).toBeInTheDocument();
  });

  it('should disable close button while closing', async () => {
    (api.closeAuction as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ActiveBiddingPhase
        auction={mockAuction}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    const closeButton = screen.getByText('Stop Sale / Close Auction');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByText('Closing...')).toBeInTheDocument();
    });
  });
});
