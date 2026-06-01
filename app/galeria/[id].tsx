import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { createExposicao, deleteGaleria, fetchExposicoes, fetchGaleria, updateGaleria } from '@/api/services';
import type { Exposicao, Galeria } from '@/api/types';
import { FormModal, StatusPicker } from '@/components/forms';
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

export default function GaleriaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { canStaff } = useAuth();
  const [galeria, setGaleria] = useState<Galeria | null>(null);
  const [exposicoes, setExposicoes] = useState<Exposicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showExposicao, setShowExposicao] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [expTitulo, setExpTitulo] = useState('');
  const [expDescricao, setExpDescricao] = useState('');
  const [expInicio, setExpInicio] = useState(todayISO());
  const [expFim, setExpFim] = useState(nextMonthISO());
  const [expStatus, setExpStatus] = useState('planejada');

  const load = useCallback(async () => {
    const galeriaId = Number(id);
    setError(null);
    const [g, exps] = await Promise.all([fetchGaleria(galeriaId), fetchExposicoes({ galeria: galeriaId })]);
    setGaleria(g);
    setExposicoes(exps);
    setNome(g.nome);
    setEndereco(g.endereco);
    setDescricao(g.descricao);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar galeria.')).finally(() => setLoading(false));
  }, [load]);

  async function salvar() {
    if (!galeria) return;
    try {
      setSaving(true);
      const updated = await updateGaleria(galeria.id, { nome, endereco, descricao });
      setGaleria(updated);
      setShowEdit(false);
      Alert.alert('Sucesso', 'Galeria atualizada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function salvarExposicao() {
    if (!galeria || !expTitulo.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe o titulo da exposicao.');
      return;
    }
    try {
      setSaving(true);
      const exp = await createExposicao({
        titulo: expTitulo.trim(),
        descricao: expDescricao,
        data_inicio: expInicio,
        data_fim: expFim,
        status: expStatus as Exposicao['status'],
        galeria: galeria.id,
      });
      setShowExposicao(false);
      setExpTitulo('');
      setExpDescricao('');
      await load();
      Alert.alert('Sucesso', 'Exposicao criada nesta galeria.', [
        { text: 'Ver exposicao', onPress: () => router.push(`/exposicao/${exp.id}`) },
        { text: 'OK' },
      ]);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao criar exposicao.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAberta() {
    if (!galeria) return;
    const updated = await updateGaleria(galeria.id, { aberta: !galeria.aberta });
    setGaleria(updated);
  }

  function confirmarExclusao() {
    if (!galeria) return;
    Alert.alert('Excluir galeria', `Remover "${galeria.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteGaleria(galeria.id);
          router.back();
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;
  if (!galeria) return <ErrorState message="Galeria nao encontrada." />;

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{galeria.nome}</Text>
        <Badge label={galeria.aberta ? 'Aberta ao publico' : 'Fechada'} tone={galeria.aberta ? 'success' : 'warning'} />

        {canStaff && (
          <Card>
            <Text style={styles.label}>Gestao (Funcionario)</Text>
            <Button label="Editar galeria" variant="secondary" icon="create-outline" onPress={() => setShowEdit(true)} />
            <Button label={galeria.aberta ? 'Fechar galeria' : 'Abrir galeria'} variant="secondary" icon="business-outline" onPress={toggleAberta} />
            <Button label="+ Nova exposicao nesta galeria" variant="secondary" icon="calendar-outline" onPress={() => setShowExposicao(true)} />
            <Button label="Excluir galeria" variant="secondary" icon="trash-outline" onPress={confirmarExclusao} />
          </Card>
        )}

        <Card>
          <Text style={styles.label}>Endereco</Text>
          <Text style={styles.text}>{galeria.endereco}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Descricao</Text>
          <Text style={styles.text}>{galeria.descricao || 'Sem descricao.'}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Exposicoes nesta galeria ({exposicoes.length})</Text>
          {exposicoes.map((exp) => (
            <Pressable key={exp.id} onPress={() => router.push(`/exposicao/${exp.id}`)}>
              <Text style={styles.item}>
                {exp.titulo} · {statusLabel(exp.status)} · {formatDate(exp.data_inicio)}
              </Text>
            </Pressable>
          ))}
          {!exposicoes.length && <Text style={styles.muted}>Nenhuma exposicao vinculada.</Text>}
        </Card>
      </ScrollView>

      <FormModal visible={showEdit} title="Editar galeria" onClose={() => setShowEdit(false)}>
        <Input label="Nome" value={nome} onChangeText={setNome} />
        <Input label="Endereco" value={endereco} onChangeText={setEndereco} />
        <Input label="Descricao" value={descricao} onChangeText={setDescricao} />
        <Button label="Salvar" loading={saving} onPress={salvar} />
      </FormModal>

      <FormModal visible={showExposicao} title="Nova exposicao" onClose={() => setShowExposicao(false)}>
        <Text style={styles.hint}>Galeria: {galeria.nome}</Text>
        <Input label="Titulo" value={expTitulo} onChangeText={setExpTitulo} />
        <Input label="Descricao" value={expDescricao} onChangeText={setExpDescricao} />
        <Input label="Data inicio (AAAA-MM-DD)" value={expInicio} onChangeText={setExpInicio} />
        <Input label="Data fim (AAAA-MM-DD)" value={expFim} onChangeText={setExpFim} />
        <StatusPicker
          label="Status"
          value={expStatus}
          options={[
            { value: 'planejada', label: 'Planejada' },
            { value: 'em_andamento', label: 'Em andamento' },
            { value: 'encerrada', label: 'Encerrada' },
          ]}
          onSelect={setExpStatus}
        />
        <Button label="Criar exposicao" loading={saving} onPress={salvarExposicao} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.accent, marginBottom: spacing.xs },
  hint: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  text: { color: colors.text, lineHeight: 22 },
  item: { color: colors.accent, fontSize: 14, lineHeight: 22, paddingVertical: 4 },
  muted: { color: colors.textMuted, fontStyle: 'italic' },
});
