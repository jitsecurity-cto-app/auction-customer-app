import RegisterForm from '../../components/RegisterForm';

export const metadata = {
  title: 'Register - Auction Platform',
  description: 'Create a new auction platform account',
};

export default function RegisterPage() {
  return (
    <main>
      <RegisterForm />
    </main>
  );
}
