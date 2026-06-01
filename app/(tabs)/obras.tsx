import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { createObra, fetchCategorias, fetchObras } from '@/api/services';
import type { CategoriaObra, ObraArte } from '@/api/types';
import { FormModal, OptionPicker } from '@/components/forms';
import { Button, Card, EmptyState, ErrorState, Input, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import { formatCurrency } from '@/utils/format';

export default function ObrasScreen() {
  const { canStaff } = useAuth();
  const [items, setItems] = useState<ObraArte[]>([]);
  const [categorias, setCategorias] = useState<CategoriaObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tecnica, setTecnica] = useState('');
  const [ano, setAno] = useState('2020');
  const [valor, setValor] = useState('10000.00');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [obras, cats] = await Promise.all([fetchObras(), fetchCategorias()]);
    setItems(obras);
    setCategorias(cats);
    if (!categoriaId && cats[0]) setCategoriaId(cats[0].id);
  }, [categoriaId]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar obras.')).finally(() => setLoading(false));
  }, [load]);

  async function salvarObra() {
    if (!titulo.trim() || !tecnica.trim() || !categoriaId) {
      Alert.alert('Campos obrigatorios', 'Preencha titulo, tecnica e categoria.');
      return;
    }
    try {
      setSaving(true);
      await createObra({
        titulo: titulo.trim(),
        tecnica: tecnica.trim(),
        ano_criacao: Number(ano),
        valor_estimado: valor,
        categoria: categoriaId,
      });
      setShowForm(false);
      setTitulo('');
      setTecnica('');
      await load();
      Alert.alert('Sucesso', 'Obra cadastrada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao cadastrar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;

  return (
    <>
      <FlatList
        style={styles.screen}
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader title="Obras de Arte" subtitle="Acervo do museu" />
            {canStaff && <Button label="+ Nova obra" icon="add-outline" onPress={() => setShowForm(true)} />}
          </View>
        }
        ListEmptyComponent={<EmptyState message="Nenhuma obra cadastrada." />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/obra/${item.id}`)}>
            <Text style={styles.title}>{item.titulo}</Text>
            <Text style={styles.meta}>{item.tecnica} · {item.ano_criacao}</Text>
            <Text style={styles.value}>{formatCurrency(item.valor_estimado)}</Text>
          </Card>
        )}
      />

      <FormModal visible={showForm} title="Cadastrar obra (Funcionario)" onClose={() => setShowForm(false)}>
        <Input label="Titulo" value={titulo} onChangeText={setTitulo} placeholder="Composicao em Azul" />
        <Input label="Tecnica" value={tecnica} onChangeText={setTecnica} placeholder="Oleo sobre tela" />
        <Input label="Ano" value={ano} onChangeText={setAno} keyboardType="numeric" />
        <Input label="Valor estimado" value={valor} onChangeText={setValor} keyboardType="numeric" />
        <OptionPicker
          label="Categoria"
          value={categoriaId}
          options={categorias.map((c) => ({ id: c.id, label: c.nome }))}
          onSelect={setCategoriaId}
        />
        <Button label="Cadastrar obra" loading={saving} onPress={salvarObra} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  headerWrap: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 14 },
  value: { color: colors.accent, fontWeight: '700', fontSize: 15 },
});
