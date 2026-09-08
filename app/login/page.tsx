import type { Metadata } from 'next';
import AuthPage from '@/components/auth/AuthPage';

export const metadata: Metadata = {
  title: 'Sign In – Your Place in the Atlas | The Qurio Atlas',
  description:
    'Create an account or sign back in to keep your roadmap progress, game tiers and badges attached to you. Accounts live on your own device — no server, no upload.',
};

export default function Page() {
  return <AuthPage />;
}
