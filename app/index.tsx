import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
