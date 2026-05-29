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
  RegisterPayload,
  Reserva,
  Restauracao,
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

export const comprarIngresso = (visitanteId: number, exposicaoId: number, valor = '60.00') =>
  apiPost<Ingresso>('/ingressos/', {
    visitante: visitanteId,
    exposicao: exposicaoId,
    tipo: 'inteira',
    valor,
    status: 'ativo',
  });

export const criarReserva = (
  visitanteId: number,
  exposicaoId: number,
  quantidade: number,
  dataReserva: string,
) =>
  apiPost<Reserva>('/reservas/', {
    visitante: visitanteId,
    exposicao: exposicaoId,
    quantidade_pessoas: quantidade,
    data_reserva: dataReserva,
    status: 'confirmada',
  });

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
