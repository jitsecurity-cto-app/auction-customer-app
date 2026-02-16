import OrderDetailPageContent from './OrderDetailPageContent';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailPageContent orderId={params.id} />;
}
