import AuctionDetail from '../../../components/AuctionDetail';

interface AuctionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  return (
    <main>
      <AuctionDetail auctionId={id} />
    </main>
  );
}

