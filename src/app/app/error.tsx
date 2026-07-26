'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RotateCcw, MessageSquare, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * App-level error boundary.
 *
 * DESIGN_UX_AUDIT.md fix: Replaces the generic NextError render with a
 * branded error state using doppel-outer-dark card styling and actionable
 * recovery. Previously scored 5/10 for error states.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: { errorBoundary: 'app' },
        extra: { digest: error.digest },
      });
    }
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0b] px-5">
      <div className="max-w-md w-full">
        <div className="doppel-outer-dark">
          <div className="doppel-inner-dark p-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>

            {/* Message */}
            <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-white/50 mb-2 leading-relaxed">
              An unexpected error occurred. This has been reported automatically
              and our team will investigate.
            </p>

            {/* Error detail (if available) */}
            {error.digest && (
              <p className="text-[11px] font-mono text-white/25 mb-6 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
                Error ID: {error.digest}
              </p>
            )}
            {!error.digest && (
              <p className="text-[11px] font-mono text-white/25 mb-6 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5 truncate">
                {error.message || 'Unknown error'}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-sm font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try again
              </button>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </div>

            {/* Support link */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <a
                href="mailto:support@gauge.chat"
                className="inline-flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/50 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
