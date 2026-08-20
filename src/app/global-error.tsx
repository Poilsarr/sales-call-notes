"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      let cancelled = false;
      void (async () => {
        const { initSentryOnError } = await import("../../sentry.client.config");
        if (cancelled) return;
        await initSentryOnError();
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(error, {
          tags: { errorBoundary: "global" },
          extra: { digest: error.digest },
        });
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            padding: "2rem",
            borderRadius: "1rem",
            background: "#0a0a0a",
            border: "1px solid #27272a",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#a1a1aa",
              margin: "0 0 1.5rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {error.digest ? `Error: ${error.digest}` : "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
