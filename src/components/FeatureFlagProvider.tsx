'use client';

import { LDProvider } from 'launchdarkly-react-client-sdk';
import { getAuthUser } from '@/lib/auth';

export default function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID;

  if (!clientId) {
    return <>{children}</>;
  }

  const user = getAuthUser();
  const context = user
    ? { kind: 'user' as const, key: String(user.id), email: user.email, name: user.name }
    : { kind: 'user' as const, key: 'anonymous', anonymous: true };

  return (
    <LDProvider clientSideID={clientId} context={context}>
      {children}
    </LDProvider>
  );
}
