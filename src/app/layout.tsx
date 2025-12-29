import Navbar from '../components/Navbar';
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}

