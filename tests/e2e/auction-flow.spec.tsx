/**
 * E2E tests for auction browsing and bidding flow
 * These tests verify the complete user flow and verify vulnerabilities exist
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuctionList from '@/components/AuctionList';
import AuctionDetail from '@/components/AuctionDetail';
import BidForm from '@/components/BidForm';
import { api } from '@/lib/api';
import { isAuthenticated, setAuth } from '@/lib/auth';
import { Auction, Bid } from '@/types';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

describe('Auction Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.location as any).reload = jest.fn();
  });

  describe('Browse Auctions Flow', () => {
    it('should complete browse auctions flow with XSS vulnerability', async () => {
      const mockAuctions: Auction[] = [
        {
          id: '1',
          title: 'Test Auction',
          description: '<img src=x onerror="alert(\'XSS\')">Malicious Description',
          starting_price: 100,
          current_bid: 150,
          end_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
          created_by: 'user1',
          created_at: new Date().toISOString(),
        },
      ];

      (api.getAuctions as jest.Mock).mockResolvedValue({ data: mockAuctions });

      const { container } = render(<AuctionList />);

      await waitFor(() => {
        expect(screen.getByText('Test Auction')).toBeInTheDocument();
      });

      // Verify XSS vulnerability: HTML is rendered without sanitization
      // Look for the description div by finding the element that contains the malicious content
      const descriptionElement = Array.from(container.querySelectorAll('div')).find(
        (div) => div.innerHTML.includes('<img') && div.innerHTML.includes('onerror')
      );
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement?.innerHTML).toContain('<img');
      expect(descriptionElement?.innerHTML).toContain('onerror');
    });

    it('should handle API errors with verbose error messages (vulnerability)', async () => {
      const errorMessage = 'SQL Error: syntax error at or near "SELECT"';
      const errorStack = 'at query (database.ts:123:45)';
      
      // Create an Error instance so the component recognizes it
      const error = new Error(errorMessage);
      error.stack = errorStack;
      
      // Mock getAuctions since that's what the component uses
      (api.getAuctions as jest.Mock).mockRejectedValue(error);

      render(<AuctionList />);

      await waitFor(() => {
        // Verify verbose error messages are displayed (vulnerability)
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('View Auction Details Flow', () => {
    it('should display auction details with XSS vulnerability', async () => {
      const mockAuction = {
        id: '1',
        title: 'Test Auction',
        description: '<script>document.cookie="stolen"</script>Malicious Content',
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

      const { container } = render(<AuctionDetail auctionId="1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Auction')).toBeInTheDocument();
      });

      // Verify XSS vulnerability: script tags are rendered
      // Look for the description div by finding the element that contains the script tag
      const descriptionElement = Array.from(container.querySelectorAll('div')).find(
        (div) => div.innerHTML.includes('<script>')
      );
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement?.innerHTML).toContain('<script>');
    });

    it('should not validate auctionId parameter (IDOR vulnerability)', async () => {
      (api.get as jest.Mock).mockResolvedValue(null);

      // Should accept any auctionId without validation
      render(<AuctionDetail auctionId="1' OR '1'='1" />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          "/auctions/1' OR '1'='1"
        );
      });
    });
  });

  describe('Place Bid Flow', () => {
    it('should complete bid placement flow without input validation', async () => {
      (isAuthenticated as jest.Mock).mockReturnValue(true);
      setAuth('mock-token', {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      });

      (api.post as jest.Mock).mockResolvedValue({
        id: 'bid1',
        auction_id: '1',
        user_id: 'user1',
        amount: 200,
        created_at: new Date().toISOString(),
      });

      render(<BidForm auctionId="1" currentBid={150} />);

      const input = screen.getByPlaceholderText('150.00');
      const submitButton = screen.getByRole('button', { name: /Place Bid/i });

      // Test that any input format is accepted (no validation)
      await userEvent.type(input, '200.999999999');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/auctions/1/bids',
          { amount: 200.999999999 },
          true
        );
      });
    });

    it('should not validate bid amount format (vulnerability)', async () => {
      (isAuthenticated as jest.Mock).mockReturnValue(true);

      render(<BidForm auctionId="1" currentBid={150} />);

      const input = screen.getByPlaceholderText('150.00') as HTMLInputElement;

      // Should accept any format without validation
      await userEvent.type(input, '1e10'); // Scientific notation
      expect(input.value).toBe('1e10');

      await userEvent.clear(input);
      await userEvent.type(input, '999999999999999999'); // Very large number
      expect(input.value).toBe('999999999999999999');
    });
  });

  describe('Vulnerability Verification', () => {
    it('should verify XSS vulnerability exists in auction descriptions', async () => {
      const xssPayload = '<img src=x onerror="alert(document.cookie)">';
      const mockAuction = {
        id: '1',
        title: 'XSS Test',
        description: xssPayload,
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
        // Verify that XSS payload is rendered as HTML (vulnerability)
        // The description is rendered with dangerouslySetInnerHTML
        // Check that the XSS payload is present in the container HTML
        expect(container.innerHTML).toContain('<img');
        expect(container.innerHTML).toContain('onerror');
      });
    });

    it('should verify no input validation on bid amounts', async () => {
      (isAuthenticated as jest.Mock).mockReturnValue(true);

      render(<BidForm auctionId="1" currentBid={100} />);

      const input = screen.getByPlaceholderText('100.00') as HTMLInputElement;

      // Test various invalid inputs that should be rejected but aren't
      const invalidInputs = [
        'abc',
        '!@#$%',
        '1.2.3.4',
      ];

      for (const invalidInput of invalidInputs) {
        await userEvent.clear(input);
        await userEvent.type(input, invalidInput);
        // Input should accept anything (vulnerability)
        expect(input.value).toBe(invalidInput);
      }
      
      // Test empty string separately (userEvent.type doesn't work with empty strings)
      await userEvent.clear(input);
      expect(input.value).toBe('');
    });
  });
});

