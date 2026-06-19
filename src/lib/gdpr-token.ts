/**
 * Token shape produced by the data-export worker and consumed by
 * the download route. Centralized here so the parse/validate
 * boundary is testable in isolation.
 *
 * Format:  exp_<expiresAtMs>_<hash16>_<userId>
 */

export function getExportTokenExpiryMs(token: string | null | undefined): number | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("_");
  if (parts.length !== 4 || parts[0] !== "exp") return null;
  const ms = Number(parts[1]);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms;
}

export function getExportTokenUserId(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("_");
  if (parts.length !== 4 || parts[0] !== "exp") return null;
  return parts[3] || null;
}

export function isExportTokenValid(
  token: string | null | undefined,
  expectedUserId: string,
  nowMs: number = Date.now()
): boolean {
  const exp = getExportTokenExpiryMs(token);
  const uid = getExportTokenUserId(token);
  if (exp === null || uid === null) return false;
  if (uid !== expectedUserId) return false;
  if (nowMs > exp) return false;
  return true;
}
