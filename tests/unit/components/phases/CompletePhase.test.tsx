/**
 * Unit tests for CompletePhase component
 * Tests dispute filing and completion display
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompletePhase from '@/components/phases/CompletePhase';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

describe('CompletePhase', () => {
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
    status: 'completed',
    completed_at: new Date().toISOString(),
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  it('should display completion information', () => {
    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Transaction Complete')).toBeInTheDocument();
    expect(screen.getByText(/✓ Completed/)).toBeInTheDocument();
    expect(screen.getByText(/Final Amount:/)).toBeInTheDocument();
    expect(screen.getByText(/Completed On:/)).toBeInTheDocument();
  });

  it('should display dispute filing section', () => {
    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('File a Dispute')).toBeInTheDocument();
    expect(screen.getByText(/If you have any issues with this transaction/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dispute Reason/i)).toBeInTheDocument();
    expect(screen.getByText('File Dispute')).toBeInTheDocument();
  });

  it('should file dispute as buyer', async () => {
    (api.createDispute as jest.Mock).mockResolvedValue({ id: '1' });

    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const reasonInput = screen.getByLabelText(/Dispute Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Item not as described' } });

    const fileButton = screen.getByText('File Dispute');
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.createDispute).toHaveBeenCalledWith({
        auction_id: '1',
        order_id: '1',
        reason: 'Item not as described',
        filed_by_role: 'buyer',
      });
      expect(window.alert).toHaveBeenCalledWith('Dispute filed successfully. Our support team will review it shortly.');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should file dispute as seller', async () => {
    (api.createDispute as jest.Mock).mockResolvedValue({ id: '1' });

    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={true}
        isBuyer={false}
        onUpdate={mockOnUpdate}
      />
    );

    const reasonInput = screen.getByLabelText(/Dispute Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Payment issue' } });

    const fileButton = screen.getByText('File Dispute');
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(api.createDispute).toHaveBeenCalledWith(
        expect.objectContaining({
          filed_by_role: 'seller',
        })
      );
    });
  });

  it('should not file dispute without reason', () => {
    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const fileButton = screen.getByText('File Dispute');
    expect(fileButton).toBeDisabled();
  });

  it('should not file dispute if user cancels confirmation', async () => {
    window.confirm = jest.fn(() => false);

    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const reasonInput = screen.getByLabelText(/Dispute Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

    const fileButton = screen.getByText('File Dispute');
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(api.createDispute).not.toHaveBeenCalled();
    });
  });

  it('should handle dispute filing error', async () => {
    const errorMessage = 'Failed to file dispute';
    (api.createDispute as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const reasonInput = screen.getByLabelText(/Dispute Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

    const fileButton = screen.getByText('File Dispute');
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should handle 404 error gracefully (endpoint not available)', async () => {
    const error = new Error('Not Found');
    (error as any).response = { status: 404 };
    (api.createDispute as jest.Mock).mockRejectedValue(error);

    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const reasonInput = screen.getByLabelText(/Dispute Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

    const fileButton = screen.getByText('File Dispute');
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Dispute filing will be available soon. For now, please contact support.');
    });
  });

  it('should clear dispute reason after successful filing', async () => {
    (api.createDispute as jest.Mock).mockResolvedValue({ id: '1' });

    render(
      <CompletePhase
        auction={mockAuction}
        order={mockOrder}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    const reasonInput = screen.getByLabelText(/Dispute Reason/i) as HTMLTextAreaElement;
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
    expect(reasonInput.value).toBe('Test reason');

    const fileButton = screen.getByText('File Dispute');
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(reasonInput.value).toBe('');
    });
  });

  it('should use current_bid if order total_amount is missing', () => {
    const orderWithoutTotal = {
      ...mockOrder,
      total_amount: null,
    };

    render(
      <CompletePhase
        auction={mockAuction}
        order={orderWithoutTotal}
        isSeller={false}
        isBuyer={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/Final Amount:/)).toBeInTheDocument();
  });
});
