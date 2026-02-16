import AuctionDetail from '../../../components/AuctionDetail';

// Required for static export with dynamic routes
// Returns a placeholder param to satisfy Next.js build requirement
// Actual routes are handled client-side
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <AuctionDetail auctionId={params.id} />
    </main>
  );
}
