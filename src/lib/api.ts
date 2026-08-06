const ACCESS_TOKEN_KEY = 'faturathi.accessToken';
const REFRESH_TOKEN_KEY = 'faturathi.refreshToken';
let activeCompany = '';
let activeBusinessGroup = '';

export interface AuthSession {
  token: string;
  refresh: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
  }
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, session.token);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, session.refresh);
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasSession() {
  return Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY));
}

export function setActiveCompany(companyIdOrCode: string) {
  activeCompany = companyIdOrCode;
}

export function setActiveBusinessGroup(groupId: string) {
  activeBusinessGroup = groupId;
}

export function unwrapList<T>(payload: T[] | { results?: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

export type ApiFieldErrors = Record<string, string[]>;

export function getApiFieldErrors(error: unknown): ApiFieldErrors {
  if (!(error instanceof ApiError) || !error.payload || typeof error.payload !== 'object') return {};
  const result: ApiFieldErrors = {};
  for (const [field, messages] of Object.entries(error.payload as Record<string, unknown>)) {
    result[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)];
  }
  return result;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (activeCompany) headers.set('X-Company-ID', activeCompany);
  if (activeBusinessGroup) headers.set('X-Business-Group-ID', activeBusinessGroup);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...init, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const body = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
    const message = body.detail || body.error || body.message || `API request failed (${response.status})`;
    throw new ApiError(response.status, String(message), payload);
  }
  return payload as T;
}
