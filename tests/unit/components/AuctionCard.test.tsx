import { render, screen } from '@testing-library/react';
import AuctionCard from '../../../src/components/AuctionCard';
import { Auction } from '../../../src/types';

// Mock Next.js Link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

describe('AuctionCard', () => {
  const mockAuction: Auction = {
    id: '1',
    title: 'Test Auction',
    description: '<script>alert("XSS")</script>Test Description',
    starting_price: 100,
    current_bid: 150,
    end_time: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    status: 'active',
    created_by: 'user1',
    created_at: new Date().toISOString(),
  };

  it('should render auction title', () => {
    render(<AuctionCard auction={mockAuction} />);
    expect(screen.getByText('Test Auction')).toBeInTheDocument();
  });

  it('should render current bid', () => {
    render(<AuctionCard auction={mockAuction} />);
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('should render starting price', () => {
    render(<AuctionCard auction={mockAuction} />);
    expect(screen.getByText(/Starting: \$100.00/)).toBeInTheDocument();
  });

  it('should render status', () => {
    render(<AuctionCard auction={mockAuction} />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should have XSS vulnerability - renders HTML without sanitization', () => {
    const { container } = render(<AuctionCard auction={mockAuction} />);
    // Verify that dangerouslySetInnerHTML is used (XSS vulnerability)
    // The description is rendered with dangerouslySetInnerHTML
    const descriptionElement = container.querySelector('div');
    expect(descriptionElement).toBeInTheDocument();
    // The HTML should be rendered, not escaped (vulnerability)
    // Check that script tag or other HTML is present in the container
    expect(container.innerHTML).toMatch(/<script|onerror|onclick/i);
  });

  it('should link to auction detail page', () => {
    render(<AuctionCard auction={mockAuction} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/auctions/1');
  });

  it('should show ended status for ended auctions', () => {
    const endedAuction: Auction = {
      ...mockAuction,
      status: 'ended',
      end_time: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
    };
    render(<AuctionCard auction={endedAuction} />);
    expect(screen.getByText('ended')).toBeInTheDocument();
  });
});

