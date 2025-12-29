import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterForm from '../../../src/components/RegisterForm';
import * as authLib from '../../../src/lib/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth library
jest.mock('../../../src/lib/auth');

describe('RegisterForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('renders registration form with name, email, and password fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    render(<RegisterForm />);

    const loginLink = screen.getByText(/login here/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('calls register function with form data on submit', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      token: 'test-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
    });
    (authLib.register as jest.Mock) = mockRegister;

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to home page after successful registration', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      token: 'test-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
    });
    (authLib.register as jest.Mock) = mockRegister;

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error message on registration failure', async () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('User already exists'));
    (authLib.register as jest.Mock) = mockRegister;

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    const mockRegister = jest.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              token: 'test-token',
              user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
            });
          }, 100);
        })
    );
    (authLib.register as jest.Mock) = mockRegister;

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/registering/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/registering/i)).not.toBeInTheDocument();
    });
  });

  it('does not validate password strength (intentional vulnerability)', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      token: 'test-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
    });
    (authLib.register as jest.Mock) = mockRegister;

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Use a very weak password
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } }); // Very weak password
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should still call register with weak password (no validation)
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
      });
    });
  });
});

