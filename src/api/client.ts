import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  return 'http://127.0.0.1:8000/api';
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function formatApiError(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null) {
    if ('detail' in data && typeof (data as { detail: unknown }).detail === 'string') {
      return (data as { detail: string }).detail;
    }
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        const text = Array.isArray(value) ? value.join(', ') : String(value);
        return `${key}: ${text}`;
      })
      .join(' · ');
  }
  return `Erro ${status}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(formatApiError(data, response.status), response.status, data);
  }

  return data as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Nao foi possivel conectar ao backend. Verifique se o Django esta rodando e se EXPO_PUBLIC_API_URL aponta para o IP correto.',
      0,
      null,
    );
  }
}

/** Junta path + filtros opcionais. Ex: '/galerias/' + {search:'MASP'} → '/galerias/?search=MASP' */
function buildUrlWithParams(path: string, params?: Record<string, string>): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }

  const queryString = searchParams.toString();
  if (!queryString) return path;

  const separator = path.includes('?') ? '&' : '?';
  return path + separator + queryString;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = buildUrlWithParams(path, params);
  return request<T>(url);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path: string): Promise<void> {
  await request<null>(path, { method: 'DELETE' });
}

export function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}
