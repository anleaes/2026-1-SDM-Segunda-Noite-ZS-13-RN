import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgCard },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="galeria/[id]" options={{ title: 'Galeria' }} />
        <Stack.Screen name="obra/[id]" options={{ title: 'Obra' }} />
        <Stack.Screen name="exposicao/[id]" options={{ title: 'Exposicao' }} />
        <Stack.Screen name="admin" options={{ title: 'Administracao' }} />
      </Stack>
    </AuthProvider>
  );
}
