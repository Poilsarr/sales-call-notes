"use client";
import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: (e: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
    console.error("[ErrorBoundary]", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
            Failed to load this section.{" "}
            <button onClick={() => this.setState({ hasError: false, error: null })} className="underline hover:text-white">
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
