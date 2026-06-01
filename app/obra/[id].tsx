import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import {
  createCertificado,
  createRestauracao,
  deleteObra,
  fetchCertificados,
  fetchObra,
  updateObra,
} from '@/api/services';
import type { Certificado, ObraArte } from '@/api/types';
import { FormModal } from '@/components/forms';
import { Button, Card, ErrorState, Input, LoadingScreen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import { formatCurrency, formatDate } from '@/utils/format';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ObraDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, canStaff, canRestauracao } = useAuth();
  const [obra, setObra] = useState<ObraArte | null>(null);
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tecnica, setTecnica] = useState('');
  const [ano, setAno] = useState('');
  const [valor, setValor] = useState('');
  const [certCodigo, setCertCodigo] = useState('');
  const [certOrgao, setCertOrgao] = useState('');
  const [restDesc, setRestDesc] = useState('');
  const [restCusto, setRestCusto] = useState('500.00');

  const load = useCallback(async () => {
    const obraId = Number(id);
    setError(null);
    const [o, certs] = await Promise.all([fetchObra(obraId), fetchCertificados(obraId)]);
    setObra(o);
    setCertificado(certs[0] ?? null);
    setTitulo(o.titulo);
    setTecnica(o.tecnica);
    setAno(String(o.ano_criacao));
    setValor(o.valor_estimado);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar obra.')).finally(() => setLoading(false));
  }, [load]);

  async function salvarObra() {
    if (!obra) return;
    try {
      setSaving(true);
      const updated = await updateObra(obra.id, {
        titulo,
        tecnica,
        ano_criacao: Number(ano),
        valor_estimado: valor,
      });
      setObra(updated);
      setShowEdit(false);
      Alert.alert('Sucesso', 'Obra atualizada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  function confirmarExclusao() {
    if (!obra) return;
    Alert.alert('Excluir obra', `Remover "${obra.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteObra(obra.id);
          router.back();
        },
      },
    ]);
  }

  async function salvarCertificado() {
    if (!obra || !certCodigo.trim() || !certOrgao.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe codigo e orgao.');
      return;
    }
    try {
      setSaving(true);
      const cert = await createCertificado({
        obra: obra.id,
        codigo: certCodigo.trim(),
        data_emissao: todayISO(),
        orgao_responsavel: certOrgao.trim(),
      });
      setCertificado(cert);
      setShowCert(false);
      Alert.alert('Sucesso', 'Certificado emitido.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao emitir.');
    } finally {
      setSaving(false);
    }
  }

  async function salvarRestauracao() {
    if (!obra || !user || !restDesc.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe a descricao.');
      return;
    }
    try {
      setSaving(true);
      await createRestauracao({
        obra: obra.id,
        funcionario: user.id,
        descricao: restDesc.trim(),
        custo: restCusto,
        data_inicio: todayISO(),
      });
      setShowRest(false);
      setRestDesc('');
      Alert.alert('Sucesso', 'Restauracao registrada.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao registrar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;
  if (!obra) return <ErrorState message="Obra nao encontrada." />;

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{obra.titulo}</Text>
        <Text style={styles.value}>{formatCurrency(obra.valor_estimado)}</Text>

        {canStaff && (
          <Card>
            <Text style={styles.label}>Gestao de acervo</Text>
            <Button label="Editar obra" variant="secondary" icon="create-outline" onPress={() => setShowEdit(true)} />
            <Button label="Excluir obra" variant="secondary" icon="trash-outline" onPress={confirmarExclusao} />
            {!certificado && (
              <Button label="Emitir certificado" variant="secondary" icon="document-outline" onPress={() => setShowCert(true)} />
            )}
          </Card>
        )}

        {canRestauracao && (
          <Card>
            <Text style={styles.label}>Restauracao (Funcionario)</Text>
            <Button label="Registrar restauracao" variant="secondary" icon="construct-outline" onPress={() => setShowRest(true)} />
          </Card>
        )}

        <Card>
          <Text style={styles.label}>Tecnica</Text>
          <Text style={styles.text}>{obra.tecnica}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Ano de criacao</Text>
          <Text style={styles.text}>{obra.ano_criacao}</Text>
        </Card>

        {certificado ? (
          <Card>
            <Text style={styles.label}>Certificado de autenticidade</Text>
            <Text style={styles.text}>Codigo: {certificado.codigo}</Text>
            <Text style={styles.text}>Emissao: {formatDate(certificado.data_emissao)}</Text>
            <Text style={styles.text}>Orgao: {certificado.orgao_responsavel}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={styles.muted}>Nenhum certificado registrado.</Text>
          </Card>
        )}
      </ScrollView>

      <FormModal visible={showEdit} title="Editar obra" onClose={() => setShowEdit(false)}>
        <Input label="Titulo" value={titulo} onChangeText={setTitulo} />
        <Input label="Tecnica" value={tecnica} onChangeText={setTecnica} />
        <Input label="Ano" value={ano} onChangeText={setAno} keyboardType="numeric" />
        <Input label="Valor" value={valor} onChangeText={setValor} keyboardType="numeric" />
        <Button label="Salvar" loading={saving} onPress={salvarObra} />
      </FormModal>

      <FormModal visible={showCert} title="Emitir certificado" onClose={() => setShowCert(false)}>
        <Input label="Codigo" value={certCodigo} onChangeText={setCertCodigo} placeholder="CERT-2026-001" />
        <Input label="Orgao responsavel" value={certOrgao} onChangeText={setCertOrgao} placeholder="Instituto do Patrimonio" />
        <Button label="Emitir" loading={saving} onPress={salvarCertificado} />
      </FormModal>

      <FormModal visible={showRest} title="Registrar restauracao" onClose={() => setShowRest(false)}>
        <Input label="Descricao" value={restDesc} onChangeText={setRestDesc} placeholder="Limpeza e consolidacao" />
        <Input label="Custo (R$)" value={restCusto} onChangeText={setRestCusto} keyboardType="numeric" />
        <Button label="Registrar" loading={saving} onPress={salvarRestauracao} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  value: { fontSize: 20, fontWeight: '700', color: colors.accent },
  label: { fontSize: 13, fontWeight: '700', color: colors.accent, marginBottom: spacing.xs },
  text: { color: colors.text, lineHeight: 22 },
  muted: { color: colors.textMuted, fontStyle: 'italic' },
});
