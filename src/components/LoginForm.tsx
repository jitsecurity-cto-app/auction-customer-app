'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/auth';
import { LoginRequest } from '../types';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Intentionally no input validation (security vulnerability)
      const loginData: LoginRequest = {
        email: email.trim(),
        password, // Intentionally no password strength check
      };

      await login(loginData);

      // Redirect to home page after successful login
      router.push('/');
      router.refresh();
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err); // Intentionally log errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      {error && (
        <div
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          role="alert"
        >
          {/* Intentionally render error without sanitization (XSS vulnerability) */}
          <div dangerouslySetInnerHTML={{ __html: error }} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a
            href="/register"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

