import LoginForm from '../../components/LoginForm';

export const metadata = {
  title: 'Login - Auction Platform',
  description: 'Login to your auction platform account',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <LoginForm />
    </main>
  );
}

