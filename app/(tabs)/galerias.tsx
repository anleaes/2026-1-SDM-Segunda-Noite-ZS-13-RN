import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { createGaleria, fetchGalerias } from '@/api/services';
import type { Galeria } from '@/api/types';
import { FormModal } from '@/components/forms';
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';

export default function GaleriasScreen() {
  const { canStaff } = useAuth();
  const [items, setItems] = useState<Galeria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setItems(await fetchGalerias());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar galerias.')).finally(() => setLoading(false));
  }, [load]);

  async function salvarGaleria() {
    if (!nome.trim() || !endereco.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe nome e endereco.');
      return;
    }
    try {
      setSaving(true);
      await createGaleria({ nome: nome.trim(), endereco: endereco.trim(), descricao, aberta: true });
      setShowForm(false);
      setNome('');
      setEndereco('');
      setDescricao('');
      await load();
      Alert.alert('Sucesso', 'Galeria criada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Nao foi possivel criar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <View style={styles.screen}>
        <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <ScreenHeader title="Galerias" subtitle="Museus e espacos expositivos" />
            {canStaff && (
              <Button label="+ Nova galeria" icon="add-outline" onPress={() => setShowForm(true)} />
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState message="Nenhuma galeria encontrada." />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/galeria/${item.id}`)}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.nome}</Text>
              <Badge label={item.aberta ? 'Aberta' : 'Fechada'} tone={item.aberta ? 'success' : 'warning'} />
            </View>
            <Text style={styles.address} numberOfLines={1}>{item.endereco}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.descricao}</Text>
          </Card>
        )}
      />

      <FormModal visible={showForm} title="Nova galeria" onClose={() => setShowForm(false)}>
        <Input label="Nome" value={nome} onChangeText={setNome} placeholder="MASP" />
        <Input label="Endereco" value={endereco} onChangeText={setEndereco} placeholder="Av. Paulista, 1578" />
        <Input label="Descricao" value={descricao} onChangeText={setDescricao} placeholder="Descricao da galeria" />
        <Button label="Criar galeria" loading={saving} onPress={salvarGaleria} />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  address: { color: colors.accent, fontSize: 13 },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
