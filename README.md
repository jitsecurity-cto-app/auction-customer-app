# Customer App

Customer-facing Next.js web application for the auction platform. Users can browse auctions, place bids, and manage their account.

## Overview

The Customer App is a Next.js application that provides the public-facing interface for the auction platform. It communicates with the Database Service API to fetch and display auction data.

## Features

- Browse active auctions
- View auction details with bid history
- Place bids on auctions (requires authentication)
- User registration and login
- View bidding history
- Navigation between pages
- Real-time auction updates (basic)

## Security Vulnerabilities

This app intentionally contains security vulnerabilities for educational purposes:
- **XSS (Cross-Site Scripting)** - Auction descriptions rendered with `dangerouslySetInnerHTML` without sanitization
- **Weak authentication handling** - No token expiration, weak JWT secrets
- **Missing CSRF protection** - No CSRF tokens
- **Insecure data storage** - Tokens stored in localStorage (XSS vulnerability)
- **No input validation** - Bid amounts, auction IDs, and other inputs accepted without validation
- **IDOR (Insecure Direct Object Reference)** - No authorization checks on auction/bid access

See `SECURITY.md` for details.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- React
- Tailwind CSS (optional)
- SWR or React Query for data fetching

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Database Service API running
- AWS account for deployment

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running Locally

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`

## Project Structure

```
customer-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Homepage with auction list
│   │   ├── globals.css   # Global styles
│   │   ├── login/
│   │   │   └── page.tsx  # Login page
│   │   ├── register/
│   │   │   └── page.tsx  # Registration page
│   │   └── auctions/
│   │       ├── page.tsx  # Auction listing page
│   │       └── [id]/
│   │           └── page.tsx  # Auction detail page
│   ├── components/       # React components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── AuctionList.tsx   # List of auctions
│   │   ├── AuctionCard.tsx   # Individual auction card
│   │   ├── AuctionDetail.tsx # Auction details view
│   │   ├── BidForm.tsx        # Bid placement form
│   │   ├── BidHistory.tsx     # Bid history table
│   │   ├── LoginForm.tsx      # Login form component
│   │   └── RegisterForm.tsx  # Registration form component
│   ├── lib/              # Utilities
│   │   ├── api.ts        # API client with fetch wrapper
│   │   └── auth.ts       # Authentication utilities
│   └── types/            # TypeScript types
│       └── index.ts      # API response interfaces
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   │   └── components/
│   │       ├── Navbar.test.tsx
│   │       ├── AuctionCard.test.tsx
│   │       ├── AuctionList.test.tsx
│   │       ├── AuctionDetail.test.tsx
│   │       ├── BidForm.test.tsx
│   │       └── BidHistory.test.tsx
│   └── e2e/              # End-to-end tests
│       └── auction-flow.spec.tsx  # Auction browsing and bidding flow
├── public/               # Static assets
├── .github/workflows/    # CI/CD pipelines
├── .env.example          # Environment variables template
├── jest.config.js        # Jest configuration
├── jest.setup.js         # Jest test setup
├── next.config.js        # Next.js configuration (static export enabled)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Code Style

- Use TypeScript
- Follow Next.js App Router conventions
- Use Server Components by default
- Client Components only when needed
- Use Tailwind CSS for styling (if configured)

### API Communication

All API calls should go through the Database Service using the API client:

```typescript
import { api } from '@/lib/api';

// Example API calls
const auctions = await api.get<Auction[]>('/auctions');
const auction = await api.get<Auction>('/auctions/1');
const bids = await api.get<Bid[]>('/auctions/1/bids');
const bid = await api.post<Bid>('/auctions/1/bids', { amount: 200 }, true);
```

**Available Pages:**
- `/` - Homepage with active auctions
- `/auctions` - All auctions listing
- `/auctions/[id]` - Auction detail page with bid form and history
- `/login` - User login page
- `/register` - User registration page

### Authentication

The app includes complete authentication pages and utilities:

**Pages:**
- `/login` - User login page
- `/register` - User registration page

**Authentication Utilities:**

```typescript
import { login, register, logout, isAuthenticated, getAuthUser } from '@/lib/auth';

// Register a new user
const result = await register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
});
// Token is automatically stored in localStorage

// Login
const result = await login({
  email: 'user@example.com',
  password: 'password123'
});
// Token is automatically stored in localStorage

// Check authentication status
if (isAuthenticated()) {
  const user = getAuthUser();
}

// Logout
logout();
```

**Security Notes:**
- Tokens are stored in localStorage (XSS vulnerability - intentional)
- No token expiration check (intentional vulnerability)
- No input validation (intentional vulnerability)
- Error messages are verbose and may expose sensitive information

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

- **Unit Tests** (`tests/unit/`) - Test individual components, functions and utilities in isolation
  - Component tests: `tests/unit/components/` - Test React components (Navbar, AuctionCard, AuctionList, AuctionDetail, BidForm, BidHistory)
  - Library tests: `tests/unit/lib/` - Test API client and auth utilities
- **E2E Tests** (`tests/e2e/`) - Test complete workflows and integration
  - `auction-flow.spec.tsx` - Complete auction browsing and bidding flow

### Test Coverage

Tests verify that:
- All components render correctly
- API client correctly makes requests to the database service
- Authentication utilities properly manage tokens
- Users can browse auctions, view details, and place bids
- XSS vulnerabilities are present (dangerouslySetInnerHTML used without sanitization)
- No input validation on bid amounts and auction IDs (intentional vulnerabilities)
- Security vulnerabilities are present (intentional)
- All core infrastructure functions work as expected

Target coverage: >80% for all new code.

## Deployment

### AWS Deployment

The app can be deployed to:
- **AWS S3 + CloudFront** (static export)
- **AWS Amplify** (full Next.js support)
- **Vercel** (alternative, not AWS)

### CI/CD

GitHub Actions automatically:
1. Runs tests and linting
2. Builds the Next.js app
3. Deploys to S3/CloudFront or Amplify

Push to `main` branch to trigger deployment.

### Static Export (S3)

The app is configured for static export to S3 in `next.config.js`:

```javascript
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // ... other config
};
```

This enables deployment to S3 + CloudFront for cost-effective static hosting.

## Cost Optimization

- Use S3 for static hosting (very cheap)
- CloudFront CDN for global distribution
- Estimated cost: $1-5/month for low traffic

## License

Educational use only.

