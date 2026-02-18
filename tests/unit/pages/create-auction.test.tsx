/**
 * Unit tests for create auction page
 * Tests form submission, validation (or lack thereof), and vulnerabilities
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateAuctionPage from '../../../src/app/auctions/new/page';
import { isAuthenticated } from '../../../src/lib/auth';
import { api } from '../../../src/lib/api';

// Mock dependencies
jest.mock('../../../src/lib/auth');
jest.mock('../../../src/lib/api');

// Mock Next.js Link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

// Mock image components
jest.mock('../../../src/components/ImageUpload', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'image-upload' }, 'Image Upload'),
  };
});
jest.mock('../../../src/components/ImageGallery', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'image-gallery' }, 'Image Gallery'),
  };
});

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('CreateAuctionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    (window.location as any).reload = jest.fn();
  });

  it('should redirect to login if not authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<CreateAuctionPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should render form fields when authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<CreateAuctionPage />);

    expect(screen.getByLabelText(/Auction Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Starting Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    expect(screen.getByText('Create Auction')).toBeInTheDocument();
  });

  it('should submit form with auction data', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: 'Test Description',
      starting_price: 100,
      current_bid: 100,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };
    (api.createAuction as jest.Mock).mockResolvedValue(mockAuction);

    render(<CreateAuctionPage />);

    // Fill in form
    await userEvent.type(screen.getByLabelText(/Auction Title/i), 'Test Auction');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test Description');
    await userEvent.type(screen.getByLabelText(/Starting Price/i), '100');
    
    // Set end time (datetime-local input)
    const endTimeInput = screen.getByLabelText(/End Time/i) as HTMLInputElement;
    const futureDate = new Date(Date.now() + 86400000);
    const dateString = futureDate.toISOString().slice(0, 16);
    fireEvent.change(endTimeInput, { target: { value: dateString } });

    // Submit form
    const submitButton = screen.getByText('Create Auction');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(api.createAuction).toHaveBeenCalledWith({
        title: 'Test Auction',
        description: 'Test Description',
        starting_price: 100,
        end_time: expect.any(String),
      });
    });

    // After creation, the page shows an image upload step instead of redirecting
    await waitFor(() => {
      expect(screen.getByText('Add Photos')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the link to view the auction is present
    expect(screen.getByText(/View Auction/i)).toBeInTheDocument();
  });

  it('should accept XSS payload in description (vulnerability)', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    const mockAuction = {
      id: '1',
      title: 'XSS Test',
      description: '<script>alert("XSS")</script>',
      starting_price: 100,
      current_bid: 100,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      created_by: 'user1',
      created_at: new Date().toISOString(),
    };
    (api.createAuction as jest.Mock).mockResolvedValue(mockAuction);

    render(<CreateAuctionPage />);

    const xssPayload = '<script>alert("XSS")</script>';
    await userEvent.type(screen.getByLabelText(/Auction Title/i), 'XSS Test');
    await userEvent.type(screen.getByLabelText(/Description/i), xssPayload);
    await userEvent.type(screen.getByLabelText(/Starting Price/i), '100');
    
    const endTimeInput = screen.getByLabelText(/End Time/i) as HTMLInputElement;
    const futureDate = new Date(Date.now() + 86400000);
    const dateString = futureDate.toISOString().slice(0, 16);
    fireEvent.change(endTimeInput, { target: { value: dateString } });

    const submitButton = screen.getByText('Create Auction');
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Verify XSS payload is sent to API without sanitization
      expect(api.createAuction).toHaveBeenCalledWith(
        expect.objectContaining({
          description: xssPayload,
        })
      );
    });
  });

  it('should not validate input format (vulnerability)', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (api.createAuction as jest.Mock).mockResolvedValue({ id: '1' });

    render(<CreateAuctionPage />);

    // Test that invalid inputs are accepted
    const titleInput = screen.getByLabelText(/Auction Title/i) as HTMLInputElement;
    const priceInput = screen.getByLabelText(/Starting Price/i) as HTMLInputElement;

    // Title with special characters
    await userEvent.type(titleInput, '<script>alert("test")</script>');
    expect(titleInput.value).toContain('<script>');

    // Price with invalid format
    await userEvent.type(priceInput, 'abc');
    expect(priceInput.value).toBe('abc');
  });

  it('should show error for invalid starting price', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<CreateAuctionPage />);

    await userEvent.type(screen.getByLabelText(/Auction Title/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Starting Price/i), '0');
    
    const endTimeInput = screen.getByLabelText(/End Time/i) as HTMLInputElement;
    const futureDate = new Date(Date.now() + 86400000);
    const dateString = futureDate.toISOString().slice(0, 16);
    fireEvent.change(endTimeInput, { target: { value: dateString } });

    const submitButton = screen.getByText('Create Auction');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Starting price must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('should show error for past end time', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<CreateAuctionPage />);

    await userEvent.type(screen.getByLabelText(/Auction Title/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Starting Price/i), '100');
    
    const endTimeInput = screen.getByLabelText(/End Time/i) as HTMLInputElement;
    const pastDate = new Date(Date.now() - 86400000);
    const dateString = pastDate.toISOString().slice(0, 16);
    fireEvent.change(endTimeInput, { target: { value: dateString } });

    const submitButton = screen.getByText('Create Auction');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/End time must be in the future/i)).toBeInTheDocument();
    });
  });

  it('should display verbose error messages (vulnerability)', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    const errorMessage = 'SQL Error: syntax error at or near "INSERT"';
    const errorStack = 'at query (database.ts:123:45)';
    const error = new Error(errorMessage);
    error.stack = errorStack;
    (api.createAuction as jest.Mock).mockRejectedValue(error);

    render(<CreateAuctionPage />);

    await userEvent.type(screen.getByLabelText(/Auction Title/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test');
    await userEvent.type(screen.getByLabelText(/Starting Price/i), '100');
    
    const endTimeInput = screen.getByLabelText(/End Time/i) as HTMLInputElement;
    const futureDate = new Date(Date.now() + 86400000);
    const dateString = futureDate.toISOString().slice(0, 16);
    fireEvent.change(endTimeInput, { target: { value: dateString } });

    const submitButton = screen.getByText('Create Auction');
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Verify verbose error message is displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should have back to auctions link', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<CreateAuctionPage />);

    const backLink = screen.getByText(/Back to Auctions/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/auctions');
  });
});

