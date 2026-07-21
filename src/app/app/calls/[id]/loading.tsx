export default function CallDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 xl:grid-cols-[0.95fr_0.95fr_0.7fr] gap-6 animate-pulse">
      <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-24 bg-white/5 rounded" />
          <div className="h-8 w-32 bg-white/5 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-white/5 rounded" />
              <div className="h-4 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
          <div className="h-5 w-32 bg-white/5 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-white/5 rounded" />
            ))}
          </div>
        </div>

        <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
          <div className="h-5 w-28 bg-white/5 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
        <div className="h-5 w-24 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
