import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, use } from 'react';

import { supabase } from './supabase';

const UserIdContext = createContext<string | null>(null);

// Signs in anonymously on first launch. Later launches reuse the stored session.
async function ensureUserId() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!signIn.user) throw new Error('Anonymous sign-in returned no user');
  return signIn.user.id;
}

type SessionGateProps = {
  loading: ReactNode;
  failed: (retry: () => void) => ReactNode;
  children: ReactNode;
};

// Renders children only once there is a signed-in user, so everything below
// can call useUserId() without handling a missing session.
export function SessionGate({ loading, failed, children }: SessionGateProps) {
  const session = useQuery({
    queryKey: ['userId'],
    queryFn: ensureUserId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (session.isPending) return loading;
  if (session.isError) return failed(() => void session.refetch());

  return <UserIdContext value={session.data}>{children}</UserIdContext>;
}

export function useUserId() {
  const userId = use(UserIdContext);
  if (userId === null) throw new Error('useUserId must be used in SessionGate');
  return userId;
}
