import Navbar from '../components/Navbar';
import ErrorHandler from '../components/ErrorHandler';
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
      <body className="min-h-screen bg-slate-50">
        <ErrorHandler />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
