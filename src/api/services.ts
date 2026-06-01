import { apiDelete, apiGet, apiPatch, apiPost, unwrapList } from './client';
import type {
  Artista,
  ArtistaObra,
  AuthUser,
  Avaliacao,
  CategoriaObra,
  Certificado,
  Exposicao,
  ExposicaoObra,
  Galeria,
  Ingresso,
  ObraArte,
  PaginatedResponse,
  Pagamento,
  RegisterPayload,
  Reserva,
  Restauracao,
  CreateFuncionarioPayload,
  CreateArtistaPayload,
  Funcionario,
} from './types';

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  return apiPost<AuthUser>('/auth/login/', { username, password });
}

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  return apiPost<AuthUser>('/auth/register/', payload);
}

export async function fetchAccount(userId: number): Promise<AuthUser> {
  return apiGet<AuthUser>(`/auth/account/${userId}/`);
}

export async function updateAccount(userId: number, payload: Partial<AuthUser>): Promise<AuthUser> {
  return apiPatch<AuthUser>(`/auth/account/${userId}/`, payload);
}

export async function deleteAccount(userId: number): Promise<void> {
  return apiDelete(`/auth/account/${userId}/`);
}

// —— Galeria (AdminWeb no diagrama) ——
export const fetchGalerias = (params?: { search?: string; aberta?: string }) =>
  apiGet<PaginatedResponse<Galeria>>('/galerias/', {
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.aberta ? { aberta: params.aberta } : {}),
  }).then((d) => d.results);

export const fetchGaleria = (id: number) => apiGet<Galeria>(`/galerias/${id}/`);
export const createGaleria = (payload: Omit<Galeria, 'id'>) =>
  apiPost<Galeria>('/galerias/', payload);
export const updateGaleria = (id: number, payload: Partial<Galeria>) =>
  apiPatch<Galeria>(`/galerias/${id}/`, payload);
export const deleteGaleria = (id: number) => apiDelete(`/galerias/${id}/`);

// —— CategoriaObra ——
export const fetchCategorias = () =>
  apiGet<PaginatedResponse<CategoriaObra>>('/categorias-obra/').then((d) => d.results);
export const createCategoria = (payload: Omit<CategoriaObra, 'id'>) =>
  apiPost<CategoriaObra>('/categorias-obra/', payload);
export const updateCategoria = (id: number, payload: Partial<CategoriaObra>) =>
  apiPatch<CategoriaObra>(`/categorias-obra/${id}/`, payload);
export const deleteCategoria = (id: number) => apiDelete(`/categorias-obra/${id}/`);

// —— ObraArte (Funcionario: cadastrarObra) ——
export const fetchObras = (params?: { search?: string; categoria?: number }) =>
  apiGet<PaginatedResponse<ObraArte>>('/obras/', {
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.categoria ? { categoria: String(params.categoria) } : {}),
  }).then((d) => d.results);

export const fetchObra = (id: number) => apiGet<ObraArte>(`/obras/${id}/`);
export const createObra = (payload: Omit<ObraArte, 'id'>) =>
  apiPost<ObraArte>('/obras/', payload);
export const updateObra = (id: number, payload: Partial<ObraArte>) =>
  apiPatch<ObraArte>(`/obras/${id}/`, payload);
export const deleteObra = (id: number) => apiDelete(`/obras/${id}/`);

// —— Certificado ——
export const fetchCertificados = (obraId: number) =>
  apiGet<PaginatedResponse<Certificado>>('/certificados/', { obra: String(obraId) }).then(
    (d) => d.results,
  );
export const createCertificado = (payload: Omit<Certificado, 'id'>) =>
  apiPost<Certificado>('/certificados/', payload);
export const updateCertificado = (id: number, payload: Partial<Certificado>) =>
  apiPatch<Certificado>(`/certificados/${id}/`, payload);
export const deleteCertificado = (id: number) => apiDelete(`/certificados/${id}/`);

// —— Artista ——
export const fetchArtistas = () =>
  apiGet<PaginatedResponse<Artista>>('/artistas/').then((d) => d.results);
export const fetchArtistaObras = (artistaId: number) =>
  apiGet<PaginatedResponse<ArtistaObra>>('/artista-obras/', {
    artista: String(artistaId),
  }).then((d) => d.results);
export const createArtistaObra = (payload: Omit<ArtistaObra, 'id'>) =>
  apiPost<ArtistaObra>('/artista-obras/', payload);
export const deleteArtistaObra = (id: number) => apiDelete(`/artista-obras/${id}/`);

// —— Exposicao (Funcionario: gerenciarExposicao) ——
export const fetchExposicoes = (params?: { search?: string; galeria?: number; status?: string }) =>
  apiGet<PaginatedResponse<Exposicao>>('/exposicoes/', {
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.galeria ? { galeria: String(params.galeria) } : {}),
    ...(params?.status ? { status: params.status } : {}),
  }).then((d) => d.results);

export const fetchExposicao = (id: number) => apiGet<Exposicao>(`/exposicoes/${id}/`);
export const createExposicao = (payload: Omit<Exposicao, 'id'>) =>
  apiPost<Exposicao>('/exposicoes/', payload);
export const updateExposicao = (id: number, payload: Partial<Exposicao>) =>
  apiPatch<Exposicao>(`/exposicoes/${id}/`, payload);
export const deleteExposicao = (id: number) => apiDelete(`/exposicoes/${id}/`);

export const fetchExposicaoObras = (exposicaoId: number) =>
  apiGet<PaginatedResponse<ExposicaoObra>>('/exposicao-obras/', {
    exposicao: String(exposicaoId),
  }).then((d) => d.results);
export const createExposicaoObra = (payload: Omit<ExposicaoObra, 'id'>) =>
  apiPost<ExposicaoObra>('/exposicao-obras/', payload);
export const deleteExposicaoObra = (id: number) => apiDelete(`/exposicao-obras/${id}/`);

// —— Visitante ——
export const fetchIngressosVisitante = (visitanteId: number) =>
  apiGet<PaginatedResponse<Ingresso>>('/ingressos/', {
    visitante: String(visitanteId),
  }).then((d) => d.results);

export const fetchReservasVisitante = (visitanteId: number) =>
  apiGet<PaginatedResponse<Reserva>>('/reservas/', {
    visitante: String(visitanteId),
  }).then((d) => d.results);

export const fetchAvaliacoesVisitante = (visitanteId: number) =>
  apiGet<PaginatedResponse<Avaliacao>>('/avaliacoes/', {
    visitante: String(visitanteId),
  }).then((d) => d.results);

export const comprarIngresso = async (
  visitanteId: number,
  exposicaoId: number,
  valor = '60.00',
  metodo: Pagamento['metodo'] = 'pix',
) => {
  const ingresso = await apiPost<Ingresso>('/ingressos/', {
    visitante: visitanteId,
    exposicao: exposicaoId,
    tipo: 'inteira',
    valor,
    status: 'ativo',
  });
  await createPagamento({
    valor,
    metodo,
    status: 'pago',
    ingresso: ingresso.id,
    reserva: null,
    restauracao: null,
  });
  return ingresso;
};

export const criarReserva = async (
  visitanteId: number,
  exposicaoId: number,
  quantidade: number,
  dataReserva: string,
  valorReserva = '40.00',
  metodo: Pagamento['metodo'] = 'pix',
) => {
  const reserva = await apiPost<Reserva>('/reservas/', {
    visitante: visitanteId,
    exposicao: exposicaoId,
    quantidade_pessoas: quantidade,
    data_reserva: dataReserva,
    status: 'confirmada',
  });
  await createPagamento({
    valor: valorReserva,
    metodo,
    status: 'pago',
    ingresso: null,
    reserva: reserva.id,
    restauracao: null,
  });
  return reserva;
};

export const updateIngresso = (id: number, payload: Partial<Ingresso>) =>
  apiPatch<Ingresso>(`/ingressos/${id}/`, payload);

export const cancelarIngresso = (id: number) =>
  updateIngresso(id, { status: 'cancelado' });

export const updateReserva = (id: number, payload: Partial<Reserva>) =>
  apiPatch<Reserva>(`/reservas/${id}/`, payload);

export const cancelarReserva = (id: number) =>
  updateReserva(id, { status: 'cancelada' });

export const updateAvaliacao = (id: number, payload: Partial<Avaliacao>) =>
  apiPatch<Avaliacao>(`/avaliacoes/${id}/`, payload);

export const deleteAvaliacao = (id: number) => apiDelete(`/avaliacoes/${id}/`);

export const fetchAvaliacaoExposicao = async (visitanteId: number, exposicaoId: number) => {
  const list = await apiGet<PaginatedResponse<Avaliacao>>('/avaliacoes/', {
    visitante: String(visitanteId),
    exposicao: String(exposicaoId),
  }).then((d) => d.results);
  return list[0] ?? null;
};

export const criarAvaliacao = (
  visitanteId: number,
  exposicaoId: number,
  nota: number,
  comentario: string,
) =>
  apiPost<Avaliacao>('/avaliacoes/', {
    visitante: visitanteId,
    exposicao: exposicaoId,
    nota,
    comentario,
  });

// —— Restauracao (Funcionario) ——
export const fetchRestauracoes = (params?: { funcionario?: number; obra?: number }) =>
  apiGet<PaginatedResponse<Restauracao>>('/restauracoes/', {
    ...(params?.funcionario ? { funcionario: String(params.funcionario) } : {}),
    ...(params?.obra ? { obra: String(params.obra) } : {}),
  }).then((d) => d.results);

export const fetchRestauracoesFuncionario = (funcionarioId: number) =>
  fetchRestauracoes({ funcionario: funcionarioId });

export const createRestauracao = (payload: {
  obra: number;
  funcionario: number;
  descricao: string;
  custo: string;
  data_inicio?: string;
}) => apiPost<Restauracao>('/restauracoes/', payload);

export const updateRestauracao = (id: number, payload: Partial<Restauracao>) =>
  apiPatch<Restauracao>(`/restauracoes/${id}/`, payload);

export const finalizarRestauracao = (id: number, dataFim?: string) =>
  updateRestauracao(id, { data_fim: dataFim ?? new Date().toISOString().slice(0, 10) });

export const deleteRestauracao = (id: number) => apiDelete(`/restauracoes/${id}/`);

// —— Pagamentos ——
export const fetchPagamentos = () =>
  apiGet<PaginatedResponse<Pagamento>>('/pagamentos/').then((d) => d.results);

export const createPagamento = (payload: Omit<Pagamento, 'id' | 'data_pagamento'>) =>
  apiPost<Pagamento>('/pagamentos/', payload);

export const updatePagamento = (id: number, payload: Partial<Pagamento>) =>
  apiPatch<Pagamento>(`/pagamentos/${id}/`, payload);

export const estornarPagamento = (id: number) =>
  updatePagamento(id, { status: 'estornado' });

// —— Funcionarios / Artistas (admin) ——
export const fetchFuncionarios = () =>
  apiGet<PaginatedResponse<Funcionario>>('/funcionarios/').then((d) => d.results);

export const createFuncionario = (payload: CreateFuncionarioPayload) =>
  apiPost<Funcionario>('/funcionarios/', payload);

export const updateFuncionario = (id: number, payload: Partial<CreateFuncionarioPayload>) =>
  apiPatch<Funcionario>(`/funcionarios/${id}/`, payload);

export const deleteFuncionario = (id: number) => apiDelete(`/funcionarios/${id}/`);

export const fetchArtistasAdmin = () =>
  apiGet<PaginatedResponse<Artista>>('/artistas/').then((d) => d.results);

export const createArtistaAdmin = (payload: CreateArtistaPayload) =>
  apiPost<Artista>('/artistas/', payload);

export const updateArtistaAdmin = (id: number, payload: Partial<CreateArtistaPayload>) =>
  apiPatch<Artista>(`/artistas/${id}/`, payload);

export const deleteArtistaAdmin = (id: number) => apiDelete(`/artistas/${id}/`);

export async function fetchDashboardCounts() {
  const [galerias, obras, exposicoes] = await Promise.all([
    apiGet<PaginatedResponse<Galeria>>('/galerias/'),
    apiGet<PaginatedResponse<ObraArte>>('/obras/'),
    apiGet<PaginatedResponse<Exposicao>>('/exposicoes/'),
  ]);

  return {
    galerias: galerias.count,
    obras: obras.count,
    exposicoes: exposicoes.count,
  };
}

export function buildFuncionarioRelatorio(user: AuthUser, counts: Awaited<ReturnType<typeof fetchDashboardCounts>>, restauracoes: Restauracao[]) {
  const custoTotal = restauracoes.reduce((sum, r) => sum + Number(r.custo || 0), 0);
  return {
    funcionario: `${user.first_name} ${user.last_name}`.trim() || user.username,
    cargo: user.cargo ?? '—',
    galeria: user.galeria_nome ?? '—',
    acervo: counts,
    restauracoes: restauracoes.length,
    custoRestauracoes: custoTotal.toFixed(2),
    geradoEm: new Date().toLocaleString('pt-BR'),
  };
}

export { unwrapList };
