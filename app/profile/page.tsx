import type { Metadata } from 'next';
import AuthGate from '@/components/auth/AuthGate';
import ProfilePage from '@/components/profile/ProfilePage';

export const metadata: Metadata = {
  title: 'My Progress – The Base Camp Climb | The Qurio Atlas',
  description:
    'Watch your stickman climb Base Camp as you read each module and clear its game. Tiered badges, best scores and a full record of the route so far — stored on your own device.',
};

export default function Page() {
  return (
    <AuthGate>
      <ProfilePage />
    </AuthGate>
  );
}
