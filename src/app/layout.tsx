import Navbar from '../components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Auction Platform - Customer',
  description: 'Customer-facing auction platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

