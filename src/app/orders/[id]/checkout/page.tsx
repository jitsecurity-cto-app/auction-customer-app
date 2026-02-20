import CheckoutPageContent from './CheckoutPageContent';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  return <CheckoutPageContent orderId={params.id} />;
}
