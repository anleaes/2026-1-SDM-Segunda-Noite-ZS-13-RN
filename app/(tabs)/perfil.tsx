import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  buildFuncionarioRelatorio,
  cancelarIngresso,
  cancelarReserva,
  createArtistaObra,
  deleteAvaliacao,
  deleteArtistaObra,
  deleteRestauracao,
  fetchArtistaObras,
  fetchAvaliacoesVisitante,
  fetchDashboardCounts,
  fetchExposicoes,
  fetchIngressosVisitante,
  fetchObra,
  fetchObras,
  fetchReservasVisitante,
  fetchRestauracoes,
  fetchRestauracoesFuncionario,
  finalizarRestauracao,
  updateAccount,
  updateAvaliacao,
  updateRestauracao,
} from '@/api/services';
import type { ArtistaObra, Avaliacao, Ingresso, ObraArte, Reserva, Restauracao } from '@/api/types';
import { FormModal, OptionPicker } from '@/components/forms';
import { Badge, Button, Card, ErrorState, Input, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import { formatCurrency, formatDate, statusLabel } from '@/utils/format';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PerfilScreen() {
  const {
    user,
    logout,
    refreshAccount,
    roleLabel,
    isVisitante,
    isFuncionario,
    isArtista,
    isAdmin,
    canStaff,
  } = useAuth();
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [restauracoes, setRestauracoes] = useState<Restauracao[]>([]);
  const [linksArtista, setLinksArtista] = useState<ArtistaObra[]>([]);
  const [obrasArtista, setObrasArtista] = useState<ObraArte[]>([]);
  const [todasObras, setTodasObras] = useState<ObraArte[]>([]);
  const [exposicaoMap, setExposicaoMap] = useState<Record<number, string>>({});
  const [obraMap, setObraMap] = useState<Record<number, string>>({});
  const [relatorio, setRelatorio] = useState<ReturnType<typeof buildFuncionarioRelatorio> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showVincularObra, setShowVincularObra] = useState(false);
  const [showEditAv, setShowEditAv] = useState(false);
  const [showEditRest, setShowEditRest] = useState(false);
  const [editingAv, setEditingAv] = useState<Avaliacao | null>(null);
  const [editingRest, setEditingRest] = useState<Restauracao | null>(null);
  const [saving, setSaving] = useState(false);
  const [nacionalidade, setNacionalidade] = useState('');
  const [estilo, setEstilo] = useState('');
  const [obraId, setObraId] = useState<number | null>(null);
  const [funcaoObra, setFuncaoObra] = useState('Autor');
  const [notaEdit, setNotaEdit] = useState('5');
  const [comentarioEdit, setComentarioEdit] = useState('');
  const [restDescEdit, setRestDescEdit] = useState('');
  const [restCustoEdit, setRestCustoEdit] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    await refreshAccount();

    const exposicoes = await fetchExposicoes();
    setExposicaoMap(Object.fromEntries(exposicoes.map((e) => [e.id, e.titulo])));

    if (user.role === 'visitante') {
      const [ing, res, av] = await Promise.all([
        fetchIngressosVisitante(user.id),
        fetchReservasVisitante(user.id),
        fetchAvaliacoesVisitante(user.id),
      ]);
      setIngressos(ing);
      setReservas(res);
      setAvaliacoes(av);
    }

    if (user.role === 'funcionario') {
      const rest = await fetchRestauracoesFuncionario(user.id);
      setRestauracoes(rest);
      const counts = await fetchDashboardCounts();
      setRelatorio(buildFuncionarioRelatorio(user, counts, rest));
      const obraIds = [...new Set(rest.map((r) => r.obra))];
      const obras = await Promise.all(obraIds.map((oid) => fetchObra(oid)));
      setObraMap(Object.fromEntries(obras.map((o) => [o.id, o.titulo])));
    }

    if (user.role === 'admin') {
      const rest = await fetchRestauracoes();
      setRestauracoes(rest);
      const obraIds = [...new Set(rest.map((r) => r.obra))];
      const obras = await Promise.all(obraIds.map((oid) => fetchObra(oid)));
      setObraMap(Object.fromEntries(obras.map((o) => [o.id, o.titulo])));
    }

    if (user.role === 'artista') {
      setNacionalidade(user.nacionalidade ?? '');
      setEstilo(user.estilo_artistico ?? '');
      const links = await fetchArtistaObras(user.id);
      setLinksArtista(links);
      const obras = await Promise.all(links.map((l) => fetchObra(l.obra)));
      setObrasArtista(obras);
      const all = await fetchObras();
      setTodasObras(all);
      if (!obraId && all[0]) setObraId(all[0].id);
    }
  }, [user, refreshAccount, obraId]);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
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

  async function salvarPortfolio() {
    if (!user) return;
    try {
      setSaving(true);
      await updateAccount(user.id, {
        nacionalidade: nacionalidade.trim(),
        estilo_artistico: estilo.trim(),
      });
      await refreshAccount();
      setShowPortfolio(false);
      Alert.alert('Sucesso', 'Portfolio atualizado.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function vincularObra() {
    if (!user || !obraId) return;
    try {
      setSaving(true);
      await createArtistaObra({
        artista: user.id,
        obra: obraId,
        funcao: funcaoObra.trim() || 'Autor',
        data_participacao: todayISO(),
      });
      setShowVincularObra(false);
      await load();
      Alert.alert('Sucesso', 'Obra vinculada ao portfolio.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao vincular.');
    } finally {
      setSaving(false);
    }
  }

  async function salvarAvaliacao() {
    if (!editingAv) return;
    try {
      setSaving(true);
      await updateAvaliacao(editingAv.id, { nota: Number(notaEdit), comentario: comentarioEdit });
      setShowEditAv(false);
      await load();
      Alert.alert('Sucesso', 'Avaliacao atualizada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function salvarRestauracaoPerfil() {
    if (!editingRest) return;
    try {
      setSaving(true);
      await updateRestauracao(editingRest.id, { descricao: restDescEdit, custo: restCustoEdit });
      setShowEditRest(false);
      await load();
      Alert.alert('Sucesso', 'Restauracao atualizada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading || !user) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <ScreenHeader title="Meu perfil" subtitle={roleLabel} />

        <Card>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
            <Badge label={roleLabel} />
          </View>
          <Text style={styles.meta}>@{user.username}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          {user.telefone ? <Text style={styles.meta}>{user.telefone}</Text> : null}
        </Card>

        {isAdmin && (
          <Card>
            <Text style={styles.sectionTitle}>Administracao</Text>
            <Text style={styles.cardText}>Gerencie funcionarios e artistas do sistema.</Text>
            <Button label="Painel admin" icon="shield-outline" onPress={() => router.push('/admin')} />
          </Card>
        )}

        {isFuncionario && relatorio && (
          <Card>
            <Text style={styles.sectionTitle}>Relatorio operacional</Text>
            <Text style={styles.item}>Galerias: {relatorio.acervo.galerias} · Obras: {relatorio.acervo.obras} · Exposicoes: {relatorio.acervo.exposicoes}</Text>
            <Text style={styles.item}>Restauracoes: {relatorio.restauracoes} · Custo: R$ {relatorio.custoRestauracoes}</Text>
          </Card>
        )}

        {isArtista && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Button label="Atualizar perfil artistico" variant="secondary" icon="brush-outline" onPress={() => setShowPortfolio(true)} />
              <Button label="+ Vincular obra" variant="secondary" icon="add-outline" onPress={() => setShowVincularObra(true)} />
            </Card>
            <Section title={`Minhas obras (${obrasArtista.length})`}>
              {linksArtista.map((link) => {
                const obra = obrasArtista.find((o) => o.id === link.obra);
                return (
                  <View key={link.id} style={styles.rowItem}>
                    <Text style={styles.item}>
                      {obra?.titulo ?? `Obra #${link.obra}`} · {link.funcao}
                    </Text>
                    <Button
                      label="Desvincular"
                      variant="ghost"
                      onPress={() =>
                        Alert.alert('Desvincular', 'Remover obra do portfolio?', [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Remover',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteArtistaObra(link.id);
                              await load();
                            },
                          },
                        ])
                      }
                    />
                  </View>
                );
              })}
              {!linksArtista.length && <Text style={styles.empty}>Nenhuma obra vinculada.</Text>}
            </Section>
          </>
        )}

        {isVisitante && (
          <>
            <Section title={`Ingressos (${ingressos.length})`}>
              {ingressos.map((item) => (
                <View key={item.id} style={styles.rowItem}>
                  <Text style={styles.item}>
                    {exposicaoMap[item.exposicao] ?? `#${item.exposicao}`} · {item.tipo} · {formatCurrency(item.valor)} · {statusLabel(item.status)}
                  </Text>
                  {item.status === 'ativo' && (
                    <Button
                      label="Cancelar"
                      variant="ghost"
                      onPress={() =>
                        Alert.alert('Cancelar ingresso', 'Confirmar cancelamento?', [
                          { text: 'Nao', style: 'cancel' },
                          {
                            text: 'Sim',
                            style: 'destructive',
                            onPress: async () => {
                              await cancelarIngresso(item.id);
                              await load();
                            },
                          },
                        ])
                      }
                    />
                  )}
                </View>
              ))}
              {!ingressos.length && <Text style={styles.empty}>Nenhum ingresso ainda.</Text>}
            </Section>

            <Section title={`Reservas (${reservas.length})`}>
              {reservas.map((item) => (
                <View key={item.id} style={styles.rowItem}>
                  <Text style={styles.item}>
                    {exposicaoMap[item.exposicao] ?? `#${item.exposicao}`} · {formatDate(item.data_reserva)} · {statusLabel(item.status)}
                  </Text>
                  {item.status !== 'cancelada' && (
                    <Button
                      label="Cancelar"
                      variant="ghost"
                      onPress={() =>
                        Alert.alert('Cancelar reserva', 'Confirmar cancelamento?', [
                          { text: 'Nao', style: 'cancel' },
                          {
                            text: 'Sim',
                            style: 'destructive',
                            onPress: async () => {
                              await cancelarReserva(item.id);
                              await load();
                            },
                          },
                        ])
                      }
                    />
                  )}
                </View>
              ))}
              {!reservas.length && <Text style={styles.empty}>Nenhuma reserva ainda.</Text>}
            </Section>

            <Section title={`Avaliacoes (${avaliacoes.length})`}>
              {avaliacoes.map((item) => (
                <View key={item.id} style={styles.rowItem}>
                  <Text style={styles.item}>
                    {exposicaoMap[item.exposicao] ?? `#${item.exposicao}`} · {'★'.repeat(item.nota)} · {item.comentario}
                  </Text>
                  <View style={styles.inlineActions}>
                    <Button
                      label="Editar"
                      variant="ghost"
                      onPress={() => {
                        setEditingAv(item);
                        setNotaEdit(String(item.nota));
                        setComentarioEdit(item.comentario);
                        setShowEditAv(true);
                      }}
                    />
                    <Button
                      label="Excluir"
                      variant="ghost"
                      onPress={() =>
                        Alert.alert('Excluir avaliacao', 'Remover esta avaliacao?', [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Excluir',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteAvaliacao(item.id);
                              await load();
                            },
                          },
                        ])
                      }
                    />
                  </View>
                </View>
              ))}
              {!avaliacoes.length && <Text style={styles.empty}>Nenhuma avaliacao ainda.</Text>}
            </Section>
          </>
        )}

        {(isFuncionario || isAdmin) && (
          <Section title={`Restauracoes (${restauracoes.length})`}>
            {restauracoes.map((item) => (
              <View key={item.id} style={styles.rowItem}>
                <Text style={styles.item}>
                  {obraMap[item.obra] ?? `Obra #${item.obra}`} · {formatCurrency(item.custo)} · {item.descricao}
                  {item.data_fim ? ` · Finalizada ${formatDate(item.data_fim)}` : ' · Em andamento'}
                </Text>
                <View style={styles.inlineActions}>
                  <Button
                    label="Editar"
                    variant="ghost"
                    onPress={() => {
                      setEditingRest(item);
                      setRestDescEdit(item.descricao);
                      setRestCustoEdit(item.custo);
                      setShowEditRest(true);
                    }}
                  />
                  {!item.data_fim && (
                    <Button
                      label="Finalizar"
                      variant="ghost"
                      onPress={async () => {
                        await finalizarRestauracao(item.id);
                        await load();
                      }}
                    />
                  )}
                  <Button
                    label="Excluir"
                    variant="ghost"
                    onPress={() =>
                      Alert.alert('Excluir', 'Remover restauracao?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: async () => {
                            await deleteRestauracao(item.id);
                            await load();
                          },
                        },
                      ])
                    }
                  />
                </View>
              </View>
            ))}
            {!restauracoes.length && <Text style={styles.empty}>Nenhuma restauracao registrada.</Text>}
          </Section>
        )}

        <Button
          label="Sair"
          variant="secondary"
          icon="log-out-outline"
          onPress={() =>
            Alert.alert('Sair', 'Deseja encerrar a sessao?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: handleLogout },
            ])
          }
        />
      </ScrollView>

      <FormModal visible={showPortfolio} title="Atualizar portfolio" onClose={() => setShowPortfolio(false)}>
        <Input label="Nacionalidade" value={nacionalidade} onChangeText={setNacionalidade} />
        <Input label="Estilo artistico" value={estilo} onChangeText={setEstilo} />
        <Button label="Salvar" loading={saving} onPress={salvarPortfolio} />
      </FormModal>

      <FormModal visible={showVincularObra} title="Vincular obra ao portfolio" onClose={() => setShowVincularObra(false)}>
        <OptionPicker label="Obra" value={obraId} options={todasObras.map((o) => ({ id: o.id, label: o.titulo }))} onSelect={setObraId} />
        <Input label="Funcao" value={funcaoObra} onChangeText={setFuncaoObra} placeholder="Autor, Co-autor..." />
        <Button label="Vincular" loading={saving} onPress={vincularObra} />
      </FormModal>

      <FormModal visible={showEditAv} title="Editar avaliacao" onClose={() => setShowEditAv(false)}>
        <Input label="Nota (1-5)" value={notaEdit} onChangeText={setNotaEdit} keyboardType="numeric" />
        <Input label="Comentario" value={comentarioEdit} onChangeText={setComentarioEdit} />
        <Button label="Salvar" loading={saving} onPress={salvarAvaliacao} />
      </FormModal>

      <FormModal visible={showEditRest} title="Editar restauracao" onClose={() => setShowEditRest(false)}>
        <Input label="Descricao" value={restDescEdit} onChangeText={setRestDescEdit} />
        <Input label="Custo" value={restCustoEdit} onChangeText={setRestCustoEdit} keyboardType="numeric" />
        <Button label="Salvar" loading={saving} onPress={salvarRestauracaoPerfil} />
      </FormModal>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sectionBody: { gap: spacing.sm },
  item: { color: colors.textMuted, fontSize: 14, lineHeight: 20, flex: 1 },
  rowItem: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  empty: { color: colors.textMuted, fontStyle: 'italic', fontSize: 14 },
  cardText: { color: colors.textMuted, lineHeight: 22, marginBottom: spacing.sm },
});
