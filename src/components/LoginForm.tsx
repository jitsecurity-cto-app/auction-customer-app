'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/auth';
import { LoginRequest } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@design-system/components';
import styles from './LoginForm.module.css';

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
    <div className={styles.container}>
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle className={styles.title}>Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {/* Intentionally render error without sanitization (XSS vulnerability) */}
              <div dangerouslySetInnerHTML={{ __html: error }} />
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              fullWidth
            />

            <Input
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don't have an account?{' '}
              <a href="/register" className={styles.link}>
                Register here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

