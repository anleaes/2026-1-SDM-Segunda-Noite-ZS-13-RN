import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { createCategoria, deleteCategoria, fetchCategorias, updateCategoria } from '@/api/services';
import type { CategoriaObra } from '@/api/types';
import { FormModal } from '@/components/forms';
import { Button, Card, EmptyState, ErrorState, Input, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';

export default function CategoriasScreen() {
  const { canStaff } = useAuth();
  const [items, setItems] = useState<CategoriaObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoriaObra | null>(null);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CategoriaObra | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setItems(await fetchCategorias());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar.')).finally(() => setLoading(false));
  }, [load]);

  function abrirForm(cat?: CategoriaObra) {
    setEditing(cat ?? null);
    setNome(cat?.nome ?? '');
    setDescricao(cat?.descricao ?? '');
    setShowForm(true);
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe o nome.');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await updateCategoria(editing.id, { nome: nome.trim(), descricao });
      } else {
        await createCategoria({ nome: nome.trim(), descricao });
      }
      setShowForm(false);
      await load();
      Alert.alert('Sucesso', editing ? 'Categoria atualizada.' : 'Categoria criada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  function confirmarExclusao(cat: CategoriaObra) {
    setDeleteError(null);
    setDeleteTarget(cat);
  }

  async function executarExclusao() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteCategoria(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Nao foi possivel excluir.');
    } finally {
      setDeleting(false);
    }
  }

  if (!canStaff) {
    return (
      <View style={styles.screen}>
        <ErrorState message="Acesso restrito a funcionarios." />
      </View>
    );
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
    <>
      <FlatList
        style={styles.screen}
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader title="Categorias" subtitle="Classificacao das obras" />
            <Button label="+ Nova categoria" icon="add-outline" onPress={() => abrirForm()} />
          </View>
        }
        ListEmptyComponent={<EmptyState message="Nenhuma categoria cadastrada." />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.title}>{item.nome}</Text>
            <Text style={styles.meta}>{item.descricao || 'Sem descricao.'}</Text>
            <View style={styles.row}>
              <Button label="Editar" variant="secondary" icon="create-outline" onPress={() => abrirForm(item)} />
              <Button label="Excluir" variant="ghost" icon="trash-outline" onPress={() => confirmarExclusao(item)} />
            </View>
          </Card>
        )}
      />

      <FormModal visible={showForm} title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={() => setShowForm(false)}>
        <Input label="Nome" value={nome} onChangeText={setNome} />
        <Input label="Descricao" value={descricao} onChangeText={setDescricao} />
        <Button label="Salvar" loading={saving} onPress={salvar} />
      </FormModal>

      <FormModal
        visible={deleteTarget !== null}
        title="Excluir categoria"
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <Text style={styles.confirmText}>
          Remover &quot;{deleteTarget?.nome}&quot;? Esta acao nao pode ser desfeita.
        </Text>
        {deleteError ? <Text style={styles.confirmError}>{deleteError}</Text> : null}
        <Button label="Excluir" loading={deleting} onPress={executarExclusao} />
        <Button label="Cancelar" variant="secondary" disabled={deleting} onPress={() => setDeleteTarget(null)} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  headerWrap: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  confirmText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  confirmError: { color: '#e5484d', fontSize: 14, lineHeight: 20 },
});
