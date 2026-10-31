import { IletinizError } from '../errors.js';

export function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

/** Üst seviyedeki `Date` değerlerini ISO 8601 dizesine çevirir. */
export function serializeDates<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out as T;
}

export function assertId(id: number, label = 'id'): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new IletinizError(`${label} pozitif tam sayı olmalıdır.`);
  }
}

export function listQuery(
  q: { limit?: number; offset?: number; status?: string } | undefined,
): Record<string, string | number | undefined> | undefined {
  if (!q) return undefined;
  return { status: q.status, limit: q.limit, offset: q.offset };
}
