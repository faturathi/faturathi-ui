export type SystemLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT' | 'TRANSMISSION';
export type SystemLogCategory = 'user' | 'ota_peppol' | 'server' | 'errors';

export interface ApiSystemLog {
  id?: string;
  created_at?: string;
  level?: string;
  category?: string;
  message?: string;
  entity?: string;
  entity_id?: string;
  action?: string;
  user_email?: string;
  detail?: Record<string, unknown> | null;
}

export interface NormalizedSystemLog {
  id: string;
  timestamp: string;
  category: SystemLogCategory;
  level: SystemLogLevel;
  entity: string;
  user: string;
  message: string;
  details: string;
}

function normalizeLevel(log: ApiSystemLog): SystemLogLevel {
  const detail = log.detail || {};
  const raw = String(log.level || detail.level || detail.severity || '').trim().toUpperCase();
  if (raw === 'WARNING') return 'WARN';
  if (raw === 'AS4' || raw === 'TRANSMISSION') return 'TRANSMISSION';
  if (raw === 'INFO' || raw === 'WARN' || raw === 'ERROR' || raw === 'AUDIT') return raw;
  if (log.entity === 'Transmission') return 'TRANSMISSION';
  if (String(log.action || '').toUpperCase().includes('ERROR')) return 'ERROR';
  return 'AUDIT';
}

function normalizeCategory(log: ApiSystemLog, level: SystemLogLevel): SystemLogCategory {
  const detail = log.detail || {};
  const raw = String(log.category || detail.category || '').trim().toUpperCase();
  if (['OTA_AS4', 'OTA_ASE', 'PEPPOL', 'TRANSMISSION'].includes(raw) || level === 'TRANSMISSION') {
    return 'ota_peppol';
  }
  if (['SERVER_API', 'SERVER', 'API'].includes(raw)) return 'server';
  if (['ERROR_WARNING', 'ERRORS', 'WARNING'].includes(raw) || level === 'ERROR' || level === 'WARN') {
    return 'errors';
  }
  return 'user';
}

export function normalizeSystemLog(log: ApiSystemLog): NormalizedSystemLog {
  const detail = log.detail || {};
  const level = normalizeLevel(log);
  const fallbackMessage = `${log.action || 'SYSTEM_EVENT'}${log.entity_id ? ` — ${log.entity_id}` : ''}`;
  return {
    id: String(log.id || `${log.created_at || ''}-${log.action || ''}`),
    timestamp: String(log.created_at || ''),
    category: normalizeCategory(log, level),
    level,
    entity: String(log.entity || 'System'),
    user: String(log.user_email || 'System'),
    message: String(log.message || detail.message || fallbackMessage),
    details: JSON.stringify(detail),
  };
}
