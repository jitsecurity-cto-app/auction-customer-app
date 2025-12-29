import RegisterForm from '../../components/RegisterForm';

export const metadata = {
  title: 'Register - Auction Platform',
  description: 'Create a new auction platform account',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <RegisterForm />
    </main>
  );
}

