import Navbar from '../components/Navbar';
import ErrorHandler from '../components/ErrorHandler';
import './globals.css';
// Import design system theme CSS directly
import '../../../design-system/src/theme/reset.css';
import '../../../design-system/src/theme/theme.css';

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
      <body>
        <ErrorHandler />
        <Navbar />
        {children}
      </body>
    </html>
  );
}

