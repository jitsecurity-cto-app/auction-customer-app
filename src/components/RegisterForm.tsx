'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '../lib/auth';
import { RegisterRequest } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@design-system/components';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
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
      // No password strength requirements, no email format validation
      const registerData: RegisterRequest = {
        name: name.trim(),
        email: email.trim(),
        password, // Intentionally no password strength check
      };

      await register(registerData);

      // Redirect to home page after successful registration
      router.push('/');
      router.refresh();
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err); // Intentionally log errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle className={styles.title}>Register</CardTitle>
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
              label="Name"
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              fullWidth
            />

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
              autoComplete="new-password"
              fullWidth
              // Intentionally no password strength requirements
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Already have an account?{' '}
              <a href="/login" className={styles.link}>
                Login here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

