import * as Sentry from "@sentry/nextjs";

type ApiContext = Record<string, unknown> & {
  userId?: string;
  requestId?: string;
  method?: string;
  status?: number;
};

const ROUTE_TAG = "api.route";

export function captureApiError(
  route: string,
  error: unknown,
  context?: ApiContext,
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    scope.setTag(ROUTE_TAG, route);
    if (context?.method) scope.setTag("api.method", String(context.method));
    if (context?.requestId) scope.setTag("api.requestId", String(context.requestId));
    if (context) {
      scope.setContext("api", context);
    }
    Sentry.captureException(error);
  });
}

export function setApiUser(userId: string | null | undefined): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}
