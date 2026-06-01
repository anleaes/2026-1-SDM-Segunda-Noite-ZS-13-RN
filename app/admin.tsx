import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  createArtistaAdmin,
  createFuncionario,
  deleteArtistaAdmin,
  deleteFuncionario,
  fetchArtistasAdmin,
  fetchFuncionarios,
  fetchGalerias,
  updateArtistaAdmin,
  updateFuncionario,
} from '@/api/services';
import type { Artista, CreateArtistaPayload, CreateFuncionarioPayload, Funcionario, Galeria } from '@/api/types';
import { FormModal, OptionPicker } from '@/components/forms';
import { Button, Card, ErrorState, Input, LoadingScreen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [galerias, setGalerias] = useState<Galeria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<'funcionario' | 'artista' | null>(null);
  const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);
  const [editingArt, setEditingArt] = useState<Artista | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('Curador');
  const [salario, setSalario] = useState('5000.00');
  const [galeriaId, setGaleriaId] = useState<number | null>(null);
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [estilo, setEstilo] = useState('Contemporaneo');

  const load = useCallback(async () => {
    setError(null);
    const [funcs, arts, gals] = await Promise.all([fetchFuncionarios(), fetchArtistasAdmin(), fetchGalerias()]);
    setFuncionarios(funcs);
    setArtistas(arts);
    setGalerias(gals);
    if (!galeriaId && gals[0]) setGaleriaId(gals[0].id);
  }, [galeriaId]);

  useEffect(() => {
    if (!isAdmin) return;
    load().catch((e) => setError(e instanceof Error ? e.message : 'Erro.')).finally(() => setLoading(false));
  }, [isAdmin, load]);

  function resetForm() {
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setCpf('');
    setCargo('Curador');
    setSalario('5000.00');
    setNacionalidade('Brasileira');
    setEstilo('Contemporaneo');
    setEditingFunc(null);
    setEditingArt(null);
  }

  function abrirFuncionario(f?: Funcionario) {
    resetForm();
    setEditingFunc(f ?? null);
    if (f) {
      setUsername(f.username);
      setFirstName(f.first_name);
      setLastName(f.last_name);
      setEmail(f.email);
      setCpf(f.cpf);
      setCargo(f.cargo);
      setSalario(f.salario);
      setGaleriaId(f.galeria);
    }
    setModal('funcionario');
  }

  function abrirArtista(a?: Artista) {
    resetForm();
    setEditingArt(a ?? null);
    if (a) {
      setUsername(a.username);
      setFirstName(a.first_name);
      setLastName(a.last_name);
      setEmail(a.email);
      setCpf(a.cpf);
      setNacionalidade(a.nacionalidade);
      setEstilo(a.estilo_artistico);
    }
    setModal('artista');
  }

  async function salvarFuncionario() {
    if (!username.trim() || !firstName.trim() || !cpf.trim()) {
      Alert.alert('Campos obrigatorios', 'Preencha usuario, nome e CPF.');
      return;
    }
    try {
      setSaving(true);
      const base = {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        cpf: cpf.trim(),
        cargo,
        salario,
        data_admissao: todayISO(),
        galeria: galeriaId,
      };
      if (editingFunc) {
        await updateFuncionario(editingFunc.id, password ? { ...base, password } : base);
      } else {
        if (!password) {
          Alert.alert('Senha obrigatoria', 'Informe a senha do novo funcionario.');
          return;
        }
        await createFuncionario({ ...base, password } as CreateFuncionarioPayload);
      }
      setModal(null);
      resetForm();
      await load();
      Alert.alert('Sucesso', editingFunc ? 'Funcionario atualizado.' : 'Funcionario criado.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function salvarArtista() {
    if (!username.trim() || !firstName.trim() || !cpf.trim()) {
      Alert.alert('Campos obrigatorios', 'Preencha usuario, nome e CPF.');
      return;
    }
    try {
      setSaving(true);
      const base = {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        cpf: cpf.trim(),
        nacionalidade: nacionalidade.trim(),
        estilo_artistico: estilo.trim(),
      };
      if (editingArt) {
        await updateArtistaAdmin(editingArt.id, password ? { ...base, password } : base);
      } else {
        if (!password) {
          Alert.alert('Senha obrigatoria', 'Informe a senha do novo artista.');
          return;
        }
        await createArtistaAdmin({ ...base, password } as CreateArtistaPayload);
      }
      setModal(null);
      resetForm();
      await load();
      Alert.alert('Sucesso', editingArt ? 'Artista atualizado.' : 'Artista criado.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return <ErrorState message="Acesso restrito ao administrador." />;
  }
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.section}>Funcionarios ({funcionarios.length})</Text>
          <Button label="+ Novo funcionario" icon="person-add-outline" onPress={() => abrirFuncionario()} />
          {funcionarios.map((f) => (
            <View key={f.id} style={styles.itemRow}>
              <Text style={styles.item}>{f.first_name} {f.last_name} · {f.cargo}</Text>
              <View style={styles.actions}>
                <Button label="Editar" variant="ghost" onPress={() => abrirFuncionario(f)} />
                <Button
                  label="Excluir"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert('Excluir', `Remover ${f.username}?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteFuncionario(f.id);
                          await load();
                        },
                      },
                    ])
                  }
                />
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.section}>Artistas ({artistas.length})</Text>
          <Button label="+ Novo artista" icon="brush-outline" onPress={() => abrirArtista()} />
          {artistas.map((a) => (
            <View key={a.id} style={styles.itemRow}>
              <Text style={styles.item}>{a.first_name} {a.last_name} · {a.estilo_artistico}</Text>
              <View style={styles.actions}>
                <Button label="Editar" variant="ghost" onPress={() => abrirArtista(a)} />
                <Button
                  label="Excluir"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert('Excluir', `Remover ${a.username}?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteArtistaAdmin(a.id);
                          await load();
                        },
                      },
                    ])
                  }
                />
              </View>
            </View>
          ))}
        </Card>

        <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
      </ScrollView>

      <FormModal
        visible={modal === 'funcionario'}
        title={editingFunc ? 'Editar funcionario' : 'Novo funcionario'}
        onClose={() => setModal(null)}
      >
        <Input label="Usuario" value={username} onChangeText={setUsername} />
        <Input label={editingFunc ? 'Nova senha (opcional)' : 'Senha'} value={password} onChangeText={setPassword} secureTextEntry />
        <Input label="Nome" value={firstName} onChangeText={setFirstName} />
        <Input label="Sobrenome" value={lastName} onChangeText={setLastName} />
        <Input label="Email" value={email} onChangeText={setEmail} />
        <Input label="CPF" value={cpf} onChangeText={setCpf} />
        <Input label="Cargo" value={cargo} onChangeText={setCargo} />
        <Input label="Salario" value={salario} onChangeText={setSalario} keyboardType="numeric" />
        <OptionPicker label="Galeria" value={galeriaId} options={galerias.map((g) => ({ id: g.id, label: g.nome }))} onSelect={setGaleriaId} />
        <Button label="Salvar" loading={saving} onPress={salvarFuncionario} />
      </FormModal>

      <FormModal visible={modal === 'artista'} title={editingArt ? 'Editar artista' : 'Novo artista'} onClose={() => setModal(null)}>
        <Input label="Usuario" value={username} onChangeText={setUsername} />
        <Input label={editingArt ? 'Nova senha (opcional)' : 'Senha'} value={password} onChangeText={setPassword} secureTextEntry />
        <Input label="Nome" value={firstName} onChangeText={setFirstName} />
        <Input label="Sobrenome" value={lastName} onChangeText={setLastName} />
        <Input label="Email" value={email} onChangeText={setEmail} />
        <Input label="CPF" value={cpf} onChangeText={setCpf} />
        <Input label="Nacionalidade" value={nacionalidade} onChangeText={setNacionalidade} />
        <Input label="Estilo artistico" value={estilo} onChangeText={setEstilo} />
        <Button label="Salvar" loading={saving} onPress={salvarArtista} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  itemRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm, gap: spacing.xs },
  item: { color: colors.textMuted, fontSize: 14 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
