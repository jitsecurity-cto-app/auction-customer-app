/**
 * Unit tests for PendingSalePhase component
 * Tests order creation, shipping preparation, and state updates
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PendingSalePhase from '@/components/phases/PendingSalePhase';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

// Helper to find input/textarea by label text (label and input are siblings, not connected by for/id)
function getInputByLabel(labelText: string | RegExp): HTMLInputElement | HTMLTextAreaElement {
  const labels = screen.getAllByText(labelText);
  for (const label of labels) {
    const input = label.parentElement?.querySelector('input, textarea');
    if (input) return input as HTMLInputElement | HTMLTextAreaElement;
  }
  throw new Error(`Could not find input for label: ${labelText}`);
}

describe('PendingSalePhase', () => {
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
    shipping_address: '123 Test St',
    status: 'pending_payment',
    tracking_number: '',
    tracking_url: '',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  describe('Buyer View - No Order', () => {
    it('should render order creation form', () => {
      render(
        <PendingSalePhase
          auction={mockAuction}
          order={null}
          isSeller={false}
          isBuyer={true}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Complete Your Purchase/)).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Test Auction')).toBeInTheDocument();
      expect(screen.getByText(/Winning Bid:/)).toBeInTheDocument();
      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText(/Complete Purchase/)).toBeInTheDocument();
    });

    it('should create order when form is submitted', async () => {
      (api.createOrder as jest.Mock).mockResolvedValue(mockOrder);

      render(
        <PendingSalePhase
          auction={mockAuction}
          order={null}
          isSeller={false}
          isBuyer={true}
          onUpdate={mockOnUpdate}
        />
      );

      const addressInput = getInputByLabel('Shipping Address');
      fireEvent.change(addressInput, { target: { value: '123 Test St' } });

      const submitButton = screen.getByText(/Complete Purchase/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createOrder).toHaveBeenCalledWith({
          auction_id: '1',
          shipping_address: '123 Test St',
        });
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('should not create order without shipping address', async () => {
      render(
        <PendingSalePhase
          auction={mockAuction}
          order={null}
          isSeller={false}
          isBuyer={true}
          onUpdate={mockOnUpdate}
        />
      );

      const submitButton = screen.getByText(/Complete Purchase/);
      expect(submitButton).toBeDisabled();
    });

    it('should handle order creation error', async () => {
      const errorMessage = 'Failed to create order';
      (api.createOrder as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(
        <PendingSalePhase
          auction={mockAuction}
          order={null}
          isSeller={false}
          isBuyer={true}
          onUpdate={mockOnUpdate}
        />
      );

      const addressInput = getInputByLabel('Shipping Address');
      fireEvent.change(addressInput, { target: { value: '123 Test St' } });

      const submitButton = screen.getByText(/Complete Purchase/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Buyer View - With Order', () => {
    it('should display order review details', () => {
      render(
        <PendingSalePhase
          auction={mockAuction}
          order={mockOrder}
          isSeller={false}
          isBuyer={true}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Review Order Details')).toBeInTheDocument();
      expect(screen.getByText(/Order Status:/)).toBeInTheDocument();
      expect(screen.getByText(/Total Amount:/)).toBeInTheDocument();
      expect(screen.getByText(/Shipping Address:/)).toBeInTheDocument();
    });
  });

  describe('Seller View', () => {
    it('should render shipping preparation form', () => {
      render(
        <PendingSalePhase
          auction={mockAuction}
          order={mockOrder}
          isSeller={true}
          isBuyer={false}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Prepare for Shipping')).toBeInTheDocument();
      expect(screen.getByText(/Buyer:/)).toBeInTheDocument();
      expect(screen.getByText(/Shipping Address:/)).toBeInTheDocument();
      expect(screen.getByText('Tracking Number')).toBeInTheDocument();
      expect(screen.getByText(/Tracking URL/)).toBeInTheDocument();
      expect(screen.getByText('Mark as Shipped')).toBeInTheDocument();
    });

    it('should mark order as shipped with tracking number', async () => {
      (api.updateOrder as jest.Mock).mockResolvedValue({});
      (api.updateWorkflowState as jest.Mock).mockResolvedValue({});

      render(
        <PendingSalePhase
          auction={mockAuction}
          order={mockOrder}
          isSeller={true}
          isBuyer={false}
          onUpdate={mockOnUpdate}
        />
      );

      const trackingInput = getInputByLabel('Tracking Number');
      fireEvent.change(trackingInput, { target: { value: 'TRACK123' } });

      const markShippedButton = screen.getByText('Mark as Shipped');
      fireEvent.click(markShippedButton);

      await waitFor(() => {
        expect(api.updateOrder).toHaveBeenCalledWith('1', {
          tracking_number: 'TRACK123',
          shipping_status: 'shipped',
          status: 'shipped',
        });
        expect(api.updateWorkflowState).toHaveBeenCalledWith('1', 'shipping');
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('should mark order as shipped with tracking URL', async () => {
      (api.updateOrder as jest.Mock).mockResolvedValue({});
      (api.updateWorkflowState as jest.Mock).mockResolvedValue({});

      render(
        <PendingSalePhase
          auction={mockAuction}
          order={mockOrder}
          isSeller={true}
          isBuyer={false}
          onUpdate={mockOnUpdate}
        />
      );

      const trackingUrlInput = getInputByLabel(/Tracking URL/);
      fireEvent.change(trackingUrlInput, { target: { value: 'https://track.example.com/123' } });

      const markShippedButton = screen.getByText('Mark as Shipped');
      fireEvent.click(markShippedButton);

      await waitFor(() => {
        expect(api.updateOrder).toHaveBeenCalledWith('1', expect.objectContaining({
          tracking_url: 'https://track.example.com/123',
        }));
      });
    });

    it('should require tracking number or URL', async () => {
      render(
        <PendingSalePhase
          auction={mockAuction}
          order={mockOrder}
          isSeller={true}
          isBuyer={false}
          onUpdate={mockOnUpdate}
        />
      );

      const markShippedButton = screen.getByText('Mark as Shipped');
      expect(markShippedButton).toBeDisabled();
    });

    it('should handle update error gracefully', async () => {
      const errorMessage = 'Failed to update order';
      (api.updateOrder as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(
        <PendingSalePhase
          auction={mockAuction}
          order={mockOrder}
          isSeller={true}
          isBuyer={false}
          onUpdate={mockOnUpdate}
        />
      );

      const trackingInput = getInputByLabel('Tracking Number');
      fireEvent.change(trackingInput, { target: { value: 'TRACK123' } });

      const markShippedButton = screen.getByText('Mark as Shipped');
      fireEvent.click(markShippedButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(errorMessage);
      });
    });
  });
});
