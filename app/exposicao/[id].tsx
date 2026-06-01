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
  fetchAvaliacaoExposicao,
  fetchExposicao,
  fetchExposicaoObras,
  fetchObra,
  fetchObras,
  updateAvaliacao,
  updateExposicao,
} from '@/api/services';
import type { Avaliacao, Exposicao, ExposicaoObra, ObraArte, Pagamento } from '@/api/types';
import { FormModal, OptionPicker, StatusPicker } from '@/components/forms';
import { Badge, Button, Card, ErrorState, Input, LoadingScreen } from '@/components/ui';
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

type ObraLink = ExposicaoObra & { titulo?: string };

const METODOS: { value: Pagamento['metodo']; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartao' },
  { value: 'dinheiro', label: 'Dinheiro' },
];

export default function ExposicaoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isVisitante, canStaff } = useAuth();
  const [exposicao, setExposicao] = useState<Exposicao | null>(null);
  const [obras, setObras] = useState<ObraArte[]>([]);
  const [links, setLinks] = useState<ObraLink[]>([]);
  const [todasObras, setTodasObras] = useState<ObraArte[]>([]);
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null);
  const [nota, setNota] = useState('5');
  const [comentario, setComentario] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<Pagamento['metodo']>('pix');
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddObra, setShowAddObra] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [obraId, setObraId] = useState<number | null>(null);
  const [posicao, setPosicao] = useState('Sala 1');
  const [statusExp, setStatusExp] = useState('planejada');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const load = useCallback(async () => {
    const exposicaoId = Number(id);
    setError(null);
    const exp = await fetchExposicao(exposicaoId);
    setExposicao(exp);
    setStatusExp(exp.status);
    setTitulo(exp.titulo);
    setDescricao(exp.descricao);
    setDataInicio(exp.data_inicio);
    setDataFim(exp.data_fim);
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
    if (user && isVisitante) {
      const av = await fetchAvaliacaoExposicao(user.id, exposicaoId);
      setAvaliacaoExistente(av);
      if (av) {
        setNota(String(av.nota));
        setComentario(av.comentario);
      }
    }
  }, [id, canStaff, isVisitante, user, obraId]);

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

  async function salvarEdicao() {
    if (!exposicao || !titulo.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe o titulo.');
      return;
    }
    try {
      setLoadingAction(true);
      const updated = await updateExposicao(exposicao.id, {
        titulo: titulo.trim(),
        descricao,
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
      setExposicao(updated);
      setShowEdit(false);
      Alert.alert('Sucesso', 'Exposicao atualizada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setLoadingAction(false);
    }
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
            <Button label="Editar exposicao" variant="secondary" icon="create-outline" onPress={() => setShowEdit(true)} />
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
            <StatusPicker label="Metodo de pagamento" value={metodoPagamento} options={METODOS} onSelect={(v) => setMetodoPagamento(v as Pagamento['metodo'])} />
            <View style={styles.actions}>
              <Button
                label="Comprar ingresso (R$ 60) + pagar"
                icon="ticket-outline"
                loading={loadingAction}
                onPress={() =>
                  runAction(
                    () => comprarIngresso(user.id, exposicao.id, '60.00', metodoPagamento).then(() => undefined),
                    'Ingresso comprado e pagamento registrado!',
                  )
                }
              />
              <Button
                label="Reservar visita (4 pessoas) + pagar R$ 40"
                variant="secondary"
                icon="calendar-outline"
                loading={loadingAction}
                onPress={() =>
                  runAction(
                    () => criarReserva(user.id, exposicao.id, 4, todayISO(), '40.00', metodoPagamento).then(() => undefined),
                    'Reserva confirmada e pagamento registrado!',
                  )
                }
              />
            </View>
            <Input label="Nota (1-5)" value={nota} onChangeText={setNota} keyboardType="numeric" />
            <Input label="Comentario" value={comentario} onChangeText={setComentario} placeholder="Sua opiniao" />
            <Button
              label={avaliacaoExistente ? 'Atualizar avaliacao' : 'Enviar avaliacao'}
              variant="secondary"
              icon="star-outline"
              loading={loadingAction}
              onPress={() =>
                runAction(async () => {
                  if (avaliacaoExistente) {
                    await updateAvaliacao(avaliacaoExistente.id, { nota: Number(nota), comentario });
                  } else {
                    await criarAvaliacao(user.id, exposicao.id, Number(nota), comentario);
                  }
                  await load();
                }, avaliacaoExistente ? 'Avaliacao atualizada!' : 'Avaliacao registrada!')
              }
            />
          </Card>
        )}
      </ScrollView>

      <FormModal visible={showEdit} title="Editar exposicao" onClose={() => setShowEdit(false)}>
        <Input label="Titulo" value={titulo} onChangeText={setTitulo} />
        <Input label="Descricao" value={descricao} onChangeText={setDescricao} />
        <Input label="Data inicio (AAAA-MM-DD)" value={dataInicio} onChangeText={setDataInicio} />
        <Input label="Data fim (AAAA-MM-DD)" value={dataFim} onChangeText={setDataFim} />
        <Button label="Salvar" loading={loadingAction} onPress={salvarEdicao} />
      </FormModal>

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
