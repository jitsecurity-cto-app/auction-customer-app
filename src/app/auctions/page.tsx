import AuctionList from '../../components/AuctionList';

export default function AuctionsPage() {
  return (
    <main>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>All Auctions</h1>
        <AuctionList />
      </div>
    </main>
  );
}

