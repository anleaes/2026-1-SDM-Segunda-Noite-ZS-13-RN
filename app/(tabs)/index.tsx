import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_URL } from '@/api/client';
import { fetchDashboardCounts } from '@/api/services';
import { Card, ErrorState, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';

export default function HomeScreen() {
  const { user, roleLabel, isVisitante, isFuncionario, isArtista, isAdmin, canStaff } = useAuth();
  const [counts, setCounts] = useState({ galerias: 0, obras: 0, exposicoes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setCounts(await fetchDashboardCounts());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar dados.')).finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar.');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;

  const shortcuts = [
    { label: 'Galerias', count: counts.galerias, route: '/(tabs)/galerias', icon: 'business' as const },
    { label: 'Obras', count: counts.obras, route: '/(tabs)/obras', icon: 'image' as const },
    { label: 'Exposicoes', count: counts.exposicoes, route: '/(tabs)/exposicoes', icon: 'calendar' as const },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ScreenHeader
        title={`Ola, ${user?.first_name || user?.username}!`}
        subtitle={`Perfil: ${roleLabel}`}
      />

      <Card>
        <Text style={styles.cardTitle}>Seu acesso</Text>
        <Text style={styles.cardText}>
          {isVisitante && 'Como visitante, compre ingressos, reserve visitas e avalie exposicoes.'}
          {isFuncionario && 'Como funcionario, cadastre galerias, obras, exposicoes e registre restauracoes.'}
          {isArtista && 'Como artista, consulte e atualize seu portfolio artistico.'}
          {isAdmin && 'Como administrador, gestao completa: galerias, acervo e exposicoes.'}
          {!isVisitante && !isFuncionario && !isArtista && !isAdmin &&
            'Explore galerias, obras e exposicoes do museu.'}
        </Text>
      </Card>

      <View style={styles.stats}>
        {shortcuts.map((item) => (
          <Card key={item.label} onPress={() => router.push(item.route)} style={styles.statCard}>
            <Ionicons name={item.icon} size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{item.count}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text style={styles.cardTitle}>Backend conectado</Text>
        <Text style={styles.cardText}>
          Dados carregados de {API_URL}.{' '}
          {canStaff && 'Modo gestao: galerias, acervo e exposicoes.'}
          {!canStaff && 'Navegue pelo acervo e programacao cultural.'}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statNumber: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardText: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
});
