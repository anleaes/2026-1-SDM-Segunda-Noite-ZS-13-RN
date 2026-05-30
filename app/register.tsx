import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/theme/colors';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    password_confirm: '',
    email: '',
    first_name: '',
    last_name: '',
    cpf: '',
    telefone: '',
  });
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!form.username.trim() || !form.password || !form.email || !form.first_name || !form.cpf) {
      Alert.alert('Campos obrigatorios', 'Preencha usuario, senha, email, nome e CPF.');
      return;
    }

    try {
      setLoading(true);
      await register({
        username: form.username.trim(),
        password: form.password,
        password_confirm: form.password_confirm || form.password,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        cpf: form.cpf.trim(),
        telefone: form.telefone.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Erro no cadastro',
        error instanceof Error ? error.message : 'Nao foi possivel cadastrar.',
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
              <Ionicons name="person-add-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>Cadastro visitante</Text>
            <Text style={styles.subtitle}>Conta criada direto no backend Django via /auth/register/</Text>
          </View>

          <View style={styles.form}>
            <Input label="Usuario" value={form.username} onChangeText={(v) => update('username', v)} />
            <Input label="Nome" value={form.first_name} onChangeText={(v) => update('first_name', v)} />
            <Input label="Sobrenome" value={form.last_name} onChangeText={(v) => update('last_name', v)} />
            <Input label="E-mail" value={form.email} onChangeText={(v) => update('email', v)} />
            <Input label="CPF" value={form.cpf} onChangeText={(v) => update('cpf', v)} />
            <Input label="Telefone" value={form.telefone} onChangeText={(v) => update('telefone', v)} />
            <Input
              label="Senha"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry
            />
            <Input
              label="Confirmar senha"
              value={form.password_confirm}
              onChangeText={(v) => update('password_confirm', v)}
              secureTextEntry
            />
            <Button label="Cadastrar" onPress={handleRegister} loading={loading} icon="checkmark-circle-outline" />
            <Button label="Voltar ao login" variant="secondary" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  form: { gap: spacing.md },
});
