const ACCESS_TOKEN_KEY = 'faturathi.accessToken';
const REFRESH_TOKEN_KEY = 'faturathi.refreshToken';
let activeCompany = '';
let activeBusinessGroup = '';

const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Accept https://host, https://host/api, or https://host/api/v1 as the configured base.
  // Existing callers use /api/... paths, so remove one duplicate /api prefix either way.
  if (/\/api(?:\/v1)?$/i.test(API_BASE_URL) && /^\/api(?:\/|$)/i.test(normalizedPath)) {
    normalizedPath = normalizedPath.slice(4) || '/';
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

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

  const response = await fetch(apiUrl(path), { ...init, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const body = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
    // Backend's global exception handler wraps errors as {"error": {"code","message","fields"}};
    // older/DRF-default responses may still use a bare "detail" string. Prefer the structured
    // message so callers never render "[object Object]" when `error` is an object.
    const errorBody = body.error && typeof body.error === 'object' ? body.error as Record<string, unknown> : null;
    const message = errorBody?.message || body.detail || body.message
      || (typeof body.error === 'string' ? body.error : null)
      || `API request failed (${response.status})`;
    const err = new ApiError(response.status, String(message), payload);
    notifyApiError(err);
    throw err;
  }
  return payload as T;
}

// Lightweight global error notification hook (item 19: surface failures to the user instead of
// only console.warn-ing them). UI layer (see ErrorBoundary.tsx / App.tsx) subscribes via
// setApiErrorListener; if nothing has subscribed yet, errors simply fall back to the console.
let apiErrorListener: ((error: ApiError) => void) | null = null;

export function setApiErrorListener(listener: ((error: ApiError) => void) | null) {
  apiErrorListener = listener;
}

function notifyApiError(error: ApiError) {
  if (apiErrorListener) {
    apiErrorListener(error);
  } else {
    console.warn('[api]', error.status, error.message);
  }
}
