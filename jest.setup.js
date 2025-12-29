// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add fetch polyfill for Node.js environment
// Node.js 18+ has fetch built-in, but Jest might need it
if (typeof global.fetch === 'undefined') {
  // Use built-in fetch if available (Node 18+)
  if (typeof require !== 'undefined') {
    try {
      global.fetch = global.fetch || require('node-fetch');
    } catch (e) {
      // If node-fetch is not available, create a mock
      global.fetch = jest.fn();
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    reload: jest.fn(),
  },
  writable: true,
});

