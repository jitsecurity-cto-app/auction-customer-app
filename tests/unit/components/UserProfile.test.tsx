import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from '@/components/UserProfile';
import { api } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';

// Mock API
jest.mock('@/lib/api');
jest.mock('@/lib/auth');

const mockApi = api as jest.Mocked<typeof api>;

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    created_at: '2024-01-01T00:00:00Z',
    password_hash: 'hashed-password-123',
    bids: [
      {
        id: '1',
        auction_id: '1',
        user_id: '1',
        amount: 100,
        created_at: '2024-01-02T00:00:00Z',
      },
    ],
    auctions: [
      {
        id: '1',
        title: 'Test Auction',
        description: 'Test Description',
        starting_price: 50,
        current_bid: 100,
        end_time: '2024-12-31T23:59:59Z',
        status: 'active' as const,
        created_by: '1',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockReturnValue({ id: '1', email: 'test@example.com', name: 'Test User', role: 'user' });
  });

  it('should display user information', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    // Verify password hash is displayed (intentional vulnerability)
    expect(screen.getByText(/hashed-password-123/)).toBeInTheDocument();
  });

  it('should display bidding history', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Bidding History')).toBeInTheDocument();
    });

    // Check for bid amount (formatted as $100.00) - may appear multiple times
    const bidAmounts = screen.getAllByText('$100.00');
    expect(bidAmounts.length).toBeGreaterThan(0);
  });

  it('should display created auctions', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Created Auctions')).toBeInTheDocument();
      expect(screen.getByText('Test Auction')).toBeInTheDocument();
    });
  });

  it('should allow editing profile', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);
    const updatedUser = { ...mockUser, name: 'Updated Name', email: 'updated@example.com' };
    mockApi.updateUser.mockResolvedValue(updatedUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Test User');
    const emailInput = screen.getByDisplayValue('test@example.com');

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'updated@example.com');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.updateUser).toHaveBeenCalledWith('1', {
        name: 'Updated Name',
        email: 'updated@example.com',
      });
    });
  });

  it('should allow password update without validation', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);
    const updatedUser = { ...mockUser };
    mockApi.updateUser.mockResolvedValue(updatedUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/New Password/i)).toBeInTheDocument();
    });

    // Find password input by type (no validation - intentional vulnerability)
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password') || screen.getByRole('textbox', { name: /password/i });
    await userEvent.type(passwordInput, 'weak-password'); // No validation

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.updateUser).toHaveBeenCalledWith('1', {
        password: 'weak-password',
      });
    });
  });

  it('should handle IDOR vulnerability - can access any user by ID', async () => {
    const otherUser = {
      ...mockUser,
      id: '2',
      email: 'other@example.com',
      name: 'Other User',
    };
    mockApi.getUserById.mockResolvedValue(otherUser);

    // No authorization check - can access user 2 even if logged in as user 1
    render(<UserProfile userId="2" />);

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
      expect(screen.getByText('other@example.com')).toBeInTheDocument();
    });

    // Can also edit other user's profile (IDOR vulnerability)
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Other User')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockApi.getUserById.mockRejectedValue(new Error('Failed to load user'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load user/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no bids', async () => {
    const userWithoutBids = {
      ...mockUser,
      bids: [],
    };
    mockApi.getUserById.mockResolvedValue(userWithoutBids);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/No bids yet/i)).toBeInTheDocument();
    });
  });

  it('should handle update error', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);
    mockApi.updateUser.mockRejectedValue(new Error('Update failed'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test User');
      expect(nameInput).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });
  });

  it('should display active disputes when viewing own profile', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);
    const mockDisputes = [
      {
        id: '1',
        auction_id: '1',
        order_id: '1',
        filed_by: '1',
        filed_by_role: 'buyer' as const,
        reason: 'Item not as described',
        status: 'open' as const,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
        auction: {
          id: '1',
          title: 'Test Auction',
          description: 'Test Description',
          starting_price: 50,
          current_bid: 100,
          end_time: '2024-12-31T23:59:59Z',
          status: 'active' as const,
          created_by: '1',
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    ];
    mockApi.getDisputes.mockResolvedValue(mockDisputes);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Active Disputes')).toBeInTheDocument();
      expect(screen.getByText('Item not as described')).toBeInTheDocument();
      expect(screen.getByText('open')).toBeInTheDocument();
    });
  });

  it('should not display disputes when viewing another user profile', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ id: '2', email: 'other@example.com', name: 'Other User', role: 'user' });
    mockApi.getUserById.mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.queryByText('Active Disputes')).not.toBeInTheDocument();
    expect(mockApi.getDisputes).not.toHaveBeenCalled();
  });

  it('should display empty state when no active disputes', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);
    mockApi.getDisputes.mockResolvedValue([]);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Active Disputes')).toBeInTheDocument();
      expect(screen.getByText('No active disputes.')).toBeInTheDocument();
    });
  });

  it('should filter to show only active disputes (open or in_review)', async () => {
    mockApi.getUserById.mockResolvedValue(mockUser);
    const mockDisputes = [
      {
        id: '1',
        auction_id: '1',
        filed_by: '1',
        filed_by_role: 'buyer' as const,
        reason: 'Active dispute',
        status: 'open' as const,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
      {
        id: '2',
        auction_id: '2',
        filed_by: '1',
        filed_by_role: 'seller' as const,
        reason: 'In review dispute',
        status: 'in_review' as const,
        created_at: '2024-01-11T00:00:00Z',
        updated_at: '2024-01-11T00:00:00Z',
      },
      {
        id: '3',
        auction_id: '3',
        filed_by: '1',
        filed_by_role: 'buyer' as const,
        reason: 'Resolved dispute',
        status: 'resolved' as const,
        created_at: '2024-01-09T00:00:00Z',
        updated_at: '2024-01-12T00:00:00Z',
      },
    ];
    mockApi.getDisputes.mockResolvedValue(mockDisputes);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Active Disputes')).toBeInTheDocument();
      expect(screen.getByText('Active dispute')).toBeInTheDocument();
      expect(screen.getByText('In review dispute')).toBeInTheDocument();
      expect(screen.queryByText('Resolved dispute')).not.toBeInTheDocument();
    });
  });
});

