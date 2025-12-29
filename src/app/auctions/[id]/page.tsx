import AuctionDetail from '../../../components/AuctionDetail';

interface AuctionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Required for static export - returns empty array to allow dynamic client-side routing
export function generateStaticParams() {
  return [];
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  
  return (
    <main>
      <AuctionDetail auctionId={id} />
    </main>
  );
}

