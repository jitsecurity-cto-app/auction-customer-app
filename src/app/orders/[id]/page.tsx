import OrderDetailPageContent from './OrderDetailPageContent';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Required for static export - returns empty array to allow dynamic client-side routing
export function generateStaticParams() {
  return [];
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetailPageContent orderId={id} />;
}
