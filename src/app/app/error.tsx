'use client';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-zinc-400 mb-4 font-mono">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition">
          Try again
        </button>
      </div>
    </div>
  );
}
