import AuctionList from '../components/AuctionList';

export default function HomePage() {
  return (
    <main>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Auction Platform</h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
          Welcome to the auction platform. Browse active auctions and place your bids!
        </p>
        <AuctionList status="active" />
      </div>
    </main>
  );
}

