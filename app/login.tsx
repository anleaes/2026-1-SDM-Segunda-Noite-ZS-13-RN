import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '@/api/client';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) {
      Alert.alert('Campos obrigatorios', 'Informe usuario e senha.');
      return;
    }

    try {
      setLoading(true);
      await login(username, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Erro ao entrar',
        error instanceof Error ? error.message : 'Verifique se o backend esta rodando.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="easel-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Museu & Galeria</Text>
            <Text style={styles.subtitle}>
              Entre com sua conta do banco de dados. O perfil e detectado automaticamente pela API.
            </Text>
            <Text style={styles.api}>API: {API_URL}</Text>
          </View>

          <View style={styles.form}>
            <Input label="Usuario" value={username} onChangeText={setUsername} placeholder="seu.usuario" />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
            />
            <Button label="Entrar" onPress={handleLogin} loading={loading} icon="log-in-outline" />
          </View>

          <Link href="/register" asChild>
            <Text style={styles.link}>Nao tem conta? Cadastre-se como visitante</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  api: { color: colors.accent, fontSize: 11, marginTop: spacing.xs },
  form: { gap: spacing.md },
  link: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});
