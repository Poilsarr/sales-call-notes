/**
 * Server-side helpers for emitting error responses safely.
 *
 * Rule: never return the raw `error.message` string to the caller.
 * Internal error messages routinely contain file paths, DB query
 * details, library internals, or other implementation specifics
 * we don't want to leak to API consumers.
 *
 * Pattern:
 *   try { ... } catch (error) {
 *     logServerError('/api/foo', error);   // server-side log only
 *     return safeErrorResponse(500, 'foo'); // generic to caller
 *   }
 *
 * For the rare case where the user-facing message IS different
 * from the internal one, build a public copy explicitly:
 *   return safeErrorResponse(500, 'foo failed', 'Try again later');
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Log an error server-side without exposing the details to the
 * caller. Captures to Sentry if available, otherwise console.error.
 */
export function logServerError(scope: string, error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
    Sentry.captureException(err, { tags: { scope } });
  }
  // console.error with a structured prefix so server logs are greppable.
  // Never log this message to the client.
  console.error(`[${scope}]`, err.message, err.stack);
}

/**
 * Build a NextResponse JSON error with a generic message.
 * The caller-provided message should describe what the operation was
 * ("load call", "save integration") — never what went wrong internally.
 */
export function safeErrorResponse(
  status: number,
  publicContext: string,
  statusText?: string
): NextResponse {
  return NextResponse.json(
    { error: publicContext },
    { status, statusText: statusText ?? undefined }
  );
}

/**
 * One-shot try/catch wrapper. Use as:
 *
 *   return withSafeError('/api/foo', 'load call', async () => {
 *     ...your handler logic, returning NextResponse...
 *   });
 */
export async function withSafeError<T>(
  scope: string,
  publicContext: string,
  fn: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    logServerError(scope, error);
    return safeErrorResponse(500, publicContext);
  }
}