import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { LoadingScreen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function TabLayout() {
  const { user, loading, canStaff } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="galerias"
        options={{
          title: 'Galerias',
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="obras"
        options={{
          title: 'Obras',
          tabBarIcon: ({ color, size }) => <Ionicons name="image-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exposicoes"
        options={{
          title: 'Exposicoes',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categorias"
        options={{
          title: 'Categorias',
          href: canStaff ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
