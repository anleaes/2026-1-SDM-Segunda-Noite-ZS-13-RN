import { colors } from '@/theme/colors';

export function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    planejada: 'Planejada',
    em_andamento: 'Em andamento',
    encerrada: 'Encerrada',
    ativo: 'Ativo',
    confirmada: 'Confirmada',
  };
  return map[status] ?? status;
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    planejada: colors.statusPlanejada,
    em_andamento: colors.statusAndamento,
    encerrada: colors.statusEncerrada,
  };
  return map[status] ?? colors.textMuted;
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    visitante: 'Visitante',
    funcionario: 'Funcionario',
    artista: 'Artista',
    admin: 'Administrador',
    usuario: 'Usuario',
  };
  return map[role] ?? role;
}
