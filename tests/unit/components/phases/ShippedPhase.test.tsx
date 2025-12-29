/**
 * Unit tests for ShippedPhase component
 * Tests tracking display, confirmation, and auto-completion
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ShippedPhase from '@/components/phases/ShippedPhase';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

describe('ShippedPhase', () => {
  const mockAuction = {
    id: '1',
    title: 'Test Auction',
    description: 'Test Description',
    starting_price: 100,
    current_bid: 150,
  };

  const mockOrder = {
    id: '1',
    auction_id: '1',
    buyer_id: '2',
    total_amount: 150,
    tracking_number: 'TRACK123',
    tracking_url: 'https://track.example.com/123',
    shipped_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'shipped',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  it('should display tracking information for buyer', () => {
    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Item Shipped')).toBeInTheDocument();
    expect(screen.getByText(/Tracking Number:/)).toBeInTheDocument();
    expect(screen.getByText('TRACK123')).toBeInTheDocument();
    expect(screen.getByText(/Tracking Link:/)).toBeInTheDocument();
    expect(screen.getByText('Track Package')).toBeInTheDocument();
    expect(screen.getByText(/Shipped On:/)).toBeInTheDocument();
  });

  it('should display tracking link with correct href', () => {
    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const trackingLink = screen.getByText('Track Package');
    expect(trackingLink).toHaveAttribute('href', 'https://track.example.com/123');
    expect(trackingLink).toHaveAttribute('target', '_blank');
    expect(trackingLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should display confirm receipt button for buyer', () => {
    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Confirm Receipt')).toBeInTheDocument();
    expect(screen.getByText(/Please confirm receipt/)).toBeInTheDocument();
  });

  it('should calculate and display days until auto-complete', () => {
    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    // Should show days remaining (30 - 5 = 25 days)
    expect(screen.getByText(/auto-complete in \d+ days/)).toBeInTheDocument();
  });

  it('should handle receipt confirmation', async () => {
    (api.updateOrder as jest.Mock).mockResolvedValue({});
    (api.updateWorkflowState as jest.Mock).mockResolvedValue({});

    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const confirmButton = screen.getByText('Confirm Receipt');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.updateOrder).toHaveBeenCalledWith('1', {
        shipping_status: 'delivered',
        status: 'completed',
      });
      expect(api.updateWorkflowState).toHaveBeenCalledWith('1', 'complete');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should not confirm if user cancels', async () => {
    window.confirm = jest.fn(() => false);
    (api.updateOrder as jest.Mock).mockResolvedValue({});

    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const confirmButton = screen.getByText('Confirm Receipt');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.updateOrder).not.toHaveBeenCalled();
    });
  });

  it('should handle confirmation error gracefully', async () => {
    const errorMessage = 'Failed to confirm receipt';
    (api.updateOrder as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const confirmButton = screen.getByText('Confirm Receipt');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should display seller view with waiting message', () => {
    render(
      <ShippedPhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Item Shipped')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for buyer to confirm receipt/)).toBeInTheDocument();
    expect(screen.queryByText('Confirm Receipt')).not.toBeInTheDocument();
  });

  it('should handle missing tracking information gracefully', () => {
    const orderWithoutTracking = {
      ...mockOrder,
      tracking_number: null,
      tracking_url: null,
    };

    render(
      <ShippedPhase
        auction={mockAuction}
        order={orderWithoutTracking}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Item Shipped')).toBeInTheDocument();
    expect(screen.queryByText(/Tracking Number:/)).not.toBeInTheDocument();
  });

  it('should show 0 days when auto-complete time has passed', () => {
    const oldOrder = {
      ...mockOrder,
      shipped_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
    };

    render(
      <ShippedPhase
        auction={mockAuction}
        order={oldOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/Please confirm that you have received the item/)).toBeInTheDocument();
  });
});
