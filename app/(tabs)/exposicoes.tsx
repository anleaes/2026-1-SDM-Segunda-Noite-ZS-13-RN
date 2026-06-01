import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { createExposicao, fetchExposicoes, fetchGalerias } from '@/api/services';
import type { Exposicao, Galeria } from '@/api/types';
import { FormModal, OptionPicker, StatusPicker } from '@/components/forms';
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import { formatDate, statusLabel } from '@/utils/format';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonthISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ExposicoesScreen() {
  const { canStaff } = useAuth();
  const [items, setItems] = useState<Exposicao[]>([]);
  const [galerias, setGalerias] = useState<Galeria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState(todayISO());
  const [dataFim, setDataFim] = useState(nextMonthISO());
  const [status, setStatus] = useState('planejada');
  const [galeriaId, setGaleriaId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [exps, gals] = await Promise.all([fetchExposicoes(), fetchGalerias()]);
    setItems(exps);
    setGalerias(gals);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar exposicoes.')).finally(() => setLoading(false));
  }, [load]);

  async function salvarExposicao() {
    if (!titulo.trim() || !galeriaId) {
      Alert.alert('Campos obrigatorios', 'Informe titulo e galeria.');
      return;
    }
    try {
      setSaving(true);
      await createExposicao({
        titulo: titulo.trim(),
        descricao,
        data_inicio: dataInicio,
        data_fim: dataFim,
        status: status as Exposicao['status'],
        galeria: galeriaId,
      });
      setShowForm(false);
      setTitulo('');
      setDescricao('');
      await load();
      Alert.alert('Sucesso', 'Exposicao criada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao criar.');
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
            <ScreenHeader title="Exposicoes" subtitle="Mostras e eventos" />
            {canStaff && (
              <Button
                label="+ Nova exposicao"
                icon="add-outline"
                onPress={() => {
                  if (!galeriaId && galerias[0]) setGaleriaId(galerias[0].id);
                  setShowForm(true);
                }}
              />
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState message="Nenhuma exposicao encontrada." />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/exposicao/${item.id}`)}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.titulo}</Text>
              <Badge label={statusLabel(item.status)} />
            </View>
            <Text style={styles.dates}>{formatDate(item.data_inicio)} — {formatDate(item.data_fim)}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.descricao}</Text>
          </Card>
        )}
      />

      <FormModal visible={showForm} title="Nova exposicao" onClose={() => setShowForm(false)}>
        <Input label="Titulo" value={titulo} onChangeText={setTitulo} />
        <Input label="Descricao" value={descricao} onChangeText={setDescricao} />
        <Input label="Data inicio (AAAA-MM-DD)" value={dataInicio} onChangeText={setDataInicio} />
        <Input label="Data fim (AAAA-MM-DD)" value={dataFim} onChangeText={setDataFim} />
        <OptionPicker label="Galeria" value={galeriaId} options={galerias.map((g) => ({ id: g.id, label: g.nome }))} onSelect={setGaleriaId} />
        <StatusPicker
          label="Status"
          value={status}
          options={[
            { value: 'planejada', label: 'Planejada' },
            { value: 'em_andamento', label: 'Em andamento' },
            { value: 'encerrada', label: 'Encerrada' },
          ]}
          onSelect={setStatus}
        />
        <Button label="Criar exposicao" loading={saving} onPress={salvarExposicao} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  headerWrap: { gap: spacing.sm, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  dates: { color: colors.accent, fontSize: 13 },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
