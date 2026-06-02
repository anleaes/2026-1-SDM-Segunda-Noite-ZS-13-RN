import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  comprarIngresso,
  createExposicaoObra,
  criarAvaliacao,
  criarReserva,
  deleteExposicao,
  deleteExposicaoObra,
  fetchExposicao,
  fetchExposicaoObras,
  fetchObra,
  fetchObras,
  updateExposicao,
} from '@/api/services';
import type { Exposicao, ExposicaoObra, ObraArte } from '@/api/types';
import { FormModal, OptionPicker, StatusPicker } from '@/components/forms';
import { Badge, Button, Card, ErrorState, Input, LoadingScreen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import { formatDate, statusLabel } from '@/utils/format';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type ObraLink = ExposicaoObra & { titulo?: string };

export default function ExposicaoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isVisitante, canStaff } = useAuth();
  const [exposicao, setExposicao] = useState<Exposicao | null>(null);
  const [obras, setObras] = useState<ObraArte[]>([]);
  const [links, setLinks] = useState<ObraLink[]>([]);
  const [todasObras, setTodasObras] = useState<ObraArte[]>([]);
  const [nota, setNota] = useState('5');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddObra, setShowAddObra] = useState(false);
  const [obraId, setObraId] = useState<number | null>(null);
  const [posicao, setPosicao] = useState('Sala 1');
  const [statusExp, setStatusExp] = useState('planejada');

  const load = useCallback(async () => {
    const exposicaoId = Number(id);
    setError(null);
    const exp = await fetchExposicao(exposicaoId);
    setExposicao(exp);
    setStatusExp(exp.status);
    const linkList = await fetchExposicaoObras(exposicaoId);
    const lista = await Promise.all(
      linkList.map(async (link) => {
        const obra = await fetchObra(link.obra);
        return { ...link, titulo: obra.titulo };
      }),
    );
    setLinks(lista);
    setObras(await Promise.all(linkList.map((link) => fetchObra(link.obra))));
    if (canStaff) {
      const all = await fetchObras();
      setTodasObras(all);
      if (!obraId && all[0]) setObraId(all[0].id);
    }
  }, [id, canStaff, obraId]);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar exposicao.'))
      .finally(() => setLoading(false));
  }, [load]);

  async function runAction(action: () => Promise<void>, success: string) {
    try {
      setLoadingAction(true);
      await action();
      Alert.alert('Sucesso', success);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Nao foi possivel concluir.');
    } finally {
      setLoadingAction(false);
    }
  }

  async function alterarStatus(novoStatus: string) {
    if (!exposicao) return;
    setStatusExp(novoStatus);
    const updated = await updateExposicao(exposicao.id, { status: novoStatus as Exposicao['status'] });
    setExposicao(updated);
    Alert.alert('Sucesso', 'Status da exposicao atualizado.');
  }

  async function adicionarObra() {
    if (!exposicao || !obraId) return;
    try {
      setLoadingAction(true);
      await createExposicaoObra({
        exposicao: exposicao.id,
        obra: obraId,
        data_entrada: todayISO(),
        posicao_sala: posicao,
        iluminacao_especial: 'Padrao',
        status_conservacao: 'Bom',
        estilo_obra: 'Contemporaneo',
      });
      setShowAddObra(false);
      await load();
      Alert.alert('Sucesso', 'Obra vinculada a exposicao.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao vincular.');
    } finally {
      setLoadingAction(false);
    }
  }

  function confirmarExclusao() {
    if (!exposicao) return;
    Alert.alert('Excluir exposicao', `Remover "${exposicao.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteExposicao(exposicao.id);
          router.back();
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;
  if (!exposicao) return <ErrorState message="Exposicao nao encontrada." />;

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{exposicao.titulo}</Text>
          <Badge label={statusLabel(exposicao.status)} />
        </View>

        <Text style={styles.dates}>
          {formatDate(exposicao.data_inicio)} — {formatDate(exposicao.data_fim)}
        </Text>

        {canStaff && (
          <Card>
            <Text style={styles.label}>Gerenciar exposicao (Funcionario)</Text>
            <StatusPicker
              label="Status"
              value={statusExp}
              options={[
                { value: 'planejada', label: 'Planejada' },
                { value: 'em_andamento', label: 'Em andamento' },
                { value: 'encerrada', label: 'Encerrada' },
              ]}
              onSelect={alterarStatus}
            />
            <Button label="+ Adicionar obra" variant="secondary" icon="add-outline" onPress={() => setShowAddObra(true)} />
            <Button label="Excluir exposicao" variant="secondary" icon="trash-outline" onPress={confirmarExclusao} />
          </Card>
        )}

        <Card>
          <Text style={styles.label}>Descricao</Text>
          <Text style={styles.text}>{exposicao.descricao}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Obras na exposicao ({obras.length})</Text>
          {links.map((link) => (
            <View key={link.id} style={styles.obraRow}>
              <Text style={styles.item}>• {link.titulo}</Text>
              {canStaff && (
                <Button
                  label="Remover"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert('Remover obra', 'Desvincular esta obra?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Remover',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteExposicaoObra(link.id);
                          await load();
                        },
                      },
                    ])
                  }
                />
              )}
            </View>
          ))}
          {!obras.length && <Text style={styles.muted}>Nenhuma obra vinculada.</Text>}
        </Card>

        {isVisitante && user && (
          <Card>
            <Text style={styles.label}>Acoes do visitante</Text>
            <View style={styles.actions}>
              <Button
                label="Comprar ingresso (R$ 60)"
                icon="ticket-outline"
                loading={loadingAction}
                onPress={() => runAction(() => comprarIngresso(user.id, exposicao.id), 'Ingresso comprado!')}
              />
              <Button
                label="Reservar visita (4 pessoas)"
                variant="secondary"
                icon="calendar-outline"
                loading={loadingAction}
                onPress={() =>
                  runAction(() => criarReserva(user.id, exposicao.id, 4, todayISO()), 'Reserva confirmada!')
                }
              />
            </View>
            <Input label="Nota (1-5)" value={nota} onChangeText={setNota} keyboardType="numeric" />
            <Input label="Comentario" value={comentario} onChangeText={setComentario} placeholder="Sua opiniao" />
            <Button
              label="Enviar avaliacao"
              variant="secondary"
              icon="star-outline"
              loading={loadingAction}
              onPress={() =>
                runAction(
                  () => criarAvaliacao(user.id, exposicao.id, Number(nota), comentario),
                  'Avaliacao registrada!',
                )
              }
            />
          </Card>
        )}
      </ScrollView>

      <FormModal visible={showAddObra} title="Vincular obra" onClose={() => setShowAddObra(false)}>
        <OptionPicker
          label="Obra"
          value={obraId}
          options={todasObras.map((o) => ({ id: o.id, label: o.titulo }))}
          onSelect={setObraId}
        />
        <Input label="Posicao na sala" value={posicao} onChangeText={setPosicao} />
        <Button label="Vincular" loading={loadingAction} onPress={adicionarObra} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
  dates: { color: colors.accent, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.accent, marginBottom: spacing.xs },
  text: { color: colors.text, lineHeight: 22 },
  item: { color: colors.textMuted, fontSize: 14, flex: 1 },
  obraRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  muted: { color: colors.textMuted, fontStyle: 'italic' },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
});
