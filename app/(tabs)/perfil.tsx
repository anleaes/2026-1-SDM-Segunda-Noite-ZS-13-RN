import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  buildFuncionarioRelatorio,
  fetchArtistaObras,
  fetchAvaliacoesVisitante,
  fetchDashboardCounts,
  fetchExposicoes,
  fetchIngressosVisitante,
  fetchObra,
  fetchReservasVisitante,
  fetchRestauracoes,
  fetchRestauracoesFuncionario,
  updateAccount,
} from '@/api/services';
import type { Avaliacao, Ingresso, ObraArte, Reserva, Restauracao } from '@/api/types';
import { FormModal } from '@/components/forms';
import { Badge, Button, Card, ErrorState, Input, LoadingScreen, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import { formatCurrency, formatDate, statusLabel } from '@/utils/format';

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
  const [obrasArtista, setObrasArtista] = useState<ObraArte[]>([]);
  const [exposicaoMap, setExposicaoMap] = useState<Record<number, string>>({});
  const [obraMap, setObraMap] = useState<Record<number, string>>({});
  const [relatorio, setRelatorio] = useState<ReturnType<typeof buildFuncionarioRelatorio> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nacionalidade, setNacionalidade] = useState('');
  const [estilo, setEstilo] = useState('');

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
      const obras = await Promise.all(links.map((l) => fetchObra(l.obra)));
      setObrasArtista(obras);
    }
  }, [user, refreshAccount]);

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

        {isFuncionario && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Dados profissionais</Text>
              {user.cargo ? <Text style={styles.item}>Cargo: {user.cargo}</Text> : null}
              {user.galeria_nome ? <Text style={styles.item}>Galeria: {user.galeria_nome}</Text> : null}
              {user.data_admissao ? <Text style={styles.item}>Admissao: {formatDate(user.data_admissao)}</Text> : null}
            </Card>

            {relatorio && (
              <Card>
                <Text style={styles.sectionTitle}>Relatorio operacional</Text>
                <Text style={styles.item}>Funcionario: {relatorio.funcionario}</Text>
                <Text style={styles.item}>Cargo: {relatorio.cargo}</Text>
                <Text style={styles.item}>Galeria: {relatorio.galeria}</Text>
                <Text style={styles.item}>Galerias no sistema: {relatorio.acervo.galerias}</Text>
                <Text style={styles.item}>Obras no acervo: {relatorio.acervo.obras}</Text>
                <Text style={styles.item}>Exposicoes: {relatorio.acervo.exposicoes}</Text>
                <Text style={styles.item}>Restauracoes realizadas: {relatorio.restauracoes}</Text>
                <Text style={styles.item}>Custo total restauracoes: R$ {relatorio.custoRestauracoes}</Text>
                <Text style={styles.muted}>Gerado em {relatorio.geradoEm}</Text>
              </Card>
            )}
          </>
        )}

        {isArtista && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Dados artisticos</Text>
              {user.nacionalidade ? <Text style={styles.item}>Nacionalidade: {user.nacionalidade}</Text> : null}
              {user.estilo_artistico ? <Text style={styles.item}>Estilo: {user.estilo_artistico}</Text> : null}
              <Button label="Atualizar portfolio" variant="secondary" icon="brush-outline" onPress={() => setShowPortfolio(true)} />
            </Card>

            <Section title={`Minhas obras (${obrasArtista.length})`}>
              {obrasArtista.map((obra) => (
                <Text key={obra.id} style={styles.item}>
                  {obra.titulo} · {obra.tecnica} · {obra.ano_criacao}
                </Text>
              ))}
              {!obrasArtista.length && <Text style={styles.empty}>Nenhuma obra vinculada.</Text>}
            </Section>
          </>
        )}

        {isAdmin && (
          <Card>
            <Text style={styles.cardText}>
              Administrador: gerencie galerias (criar/editar), acervo e exposicoes pelo app. Restauracoes de todo o sistema listadas abaixo.
            </Text>
          </Card>
        )}

        {isVisitante && (
          <>
            <Section title={`Ingressos (${ingressos.length})`}>
              {ingressos.map((item) => (
                <Text key={item.id} style={styles.item}>
                  {exposicaoMap[item.exposicao] ?? `#${item.exposicao}`} · {item.tipo} · {formatCurrency(item.valor)}
                </Text>
              ))}
              {!ingressos.length && <Text style={styles.empty}>Nenhum ingresso ainda.</Text>}
            </Section>

            <Section title={`Reservas (${reservas.length})`}>
              {reservas.map((item) => (
                <Text key={item.id} style={styles.item}>
                  {exposicaoMap[item.exposicao] ?? `#${item.exposicao}`} · {formatDate(item.data_reserva)} · {item.quantidade_pessoas} pessoas · {statusLabel(item.status)}
                </Text>
              ))}
              {!reservas.length && <Text style={styles.empty}>Nenhuma reserva ainda.</Text>}
            </Section>

            <Section title={`Avaliacoes (${avaliacoes.length})`}>
              {avaliacoes.map((item) => (
                <Text key={item.id} style={styles.item}>
                  {exposicaoMap[item.exposicao] ?? `#${item.exposicao}`} · {'★'.repeat(item.nota)} · {item.comentario}
                </Text>
              ))}
              {!avaliacoes.length && <Text style={styles.empty}>Nenhuma avaliacao ainda.</Text>}
            </Section>
          </>
        )}

        {(isFuncionario || isAdmin) && (
          <Section title={`Restauracoes (${restauracoes.length})`}>
            {restauracoes.map((item) => (
              <Text key={item.id} style={styles.item}>
                {obraMap[item.obra] ?? `Obra #${item.obra}`} · {formatCurrency(item.custo)} · {item.descricao}
              </Text>
            ))}
            {!restauracoes.length && <Text style={styles.empty}>Nenhuma restauracao registrada.</Text>}
          </Section>
        )}

        {canStaff && isFuncionario && (
          <Card>
            <Text style={styles.cardText}>
              Como funcionario: crie galerias, cadastre obras, monte exposicoes e registre restauracoes.
            </Text>
          </Card>
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

      <FormModal visible={showPortfolio} title="Atualizar portfolio (Artista)" onClose={() => setShowPortfolio(false)}>
        <Input label="Nacionalidade" value={nacionalidade} onChangeText={setNacionalidade} placeholder="Brasileira" />
        <Input label="Estilo artistico" value={estilo} onChangeText={setEstilo} placeholder="Contemporaneo" />
        <Button label="Salvar portfolio" loading={saving} onPress={salvarPortfolio} />
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
  item: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  empty: { color: colors.textMuted, fontStyle: 'italic', fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  cardText: { color: colors.textMuted, lineHeight: 22 },
});
