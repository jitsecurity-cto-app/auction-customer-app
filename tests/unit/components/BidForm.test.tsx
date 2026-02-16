import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BidForm from '../../../src/components/BidForm';
import { api } from '../../../src/lib/api';
import { isAuthenticated } from '../../../src/lib/auth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('../../../src/lib/api');
jest.mock('../../../src/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Helper to find the bid amount input (no label in new Tailwind design)
function getBidAmountInput() {
  const input = screen.getByPlaceholderText(/\d+\.\d{2}/);
  if (!input) throw new Error('Could not find bid amount input');
  return input as HTMLInputElement;
}

describe('BidForm', () => {
  const mockPush = jest.fn();
  const mockOnBidPlaced = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (window.location as any).reload = jest.fn();
  });

  it('should redirect to login if user is not authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<BidForm auctionId="1" currentBid={100} />);

    // Text is split across elements, so check for parts
    expect(screen.getByText(/Please/)).toBeInTheDocument();
    expect(screen.getByText(/login/)).toBeInTheDocument();
  });

  it('should render bid form when authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<BidForm auctionId="1" currentBid={100} />);

    expect(screen.getByText('Place a Bid')).toBeInTheDocument();
    expect(screen.getByText('Current bid')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('should place bid successfully', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (api.post as jest.Mock).mockResolvedValue({ id: 'bid1', amount: 150 });

    render(<BidForm auctionId="1" currentBid={100} onBidPlaced={mockOnBidPlaced} />);

    const input = getBidAmountInput();
    const submitButton = screen.getByRole('button', { name: /Place Bid/i });

    await userEvent.type(input, '150');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/auctions/1/bids',
        { amount: 150 },
        true
      );
    });
  });

  it('should show error for invalid bid amount', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<BidForm auctionId="1" currentBid={100} />);

    const input = getBidAmountInput();
    const submitButton = screen.getByRole('button', { name: /Place Bid/i });

    await userEvent.type(input, '50'); // Less than current bid
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Bid must be greater than current bid/)).toBeInTheDocument();
    });
  });

  it('should show error for non-numeric input', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<BidForm auctionId="1" currentBid={100} />);

    const input = getBidAmountInput();
    const submitButton = screen.getByRole('button', { name: /Place Bid/i });

    await userEvent.type(input, 'abc');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid number/)).toBeInTheDocument();
    });
  });

  it('should display API error messages', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    const errorMessage = 'Auction not found';
    (api.post as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<BidForm auctionId="1" currentBid={100} />);

    const input = getBidAmountInput();
    const submitButton = screen.getByRole('button', { name: /Place Bid/i });

    await userEvent.type(input, '150');
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Error message should be displayed (may be in error div)
      const errorText = screen.queryByText(new RegExp(errorMessage, 'i'));
      expect(errorText || screen.queryByText(/Error:/)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should accept any input format without validation (vulnerability)', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (api.post as jest.Mock).mockResolvedValue({ id: 'bid1', amount: 150 });

    render(<BidForm auctionId="1" currentBid={100} />);

    const input = getBidAmountInput();

    // Test that input accepts any format (no validation)
    await userEvent.type(input, '150.999999');
    expect(input.value).toBe('150.999999');
  });
});
