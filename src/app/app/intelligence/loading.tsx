export default function IntelligenceLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-56 bg-white/5 rounded mb-2" />
        <div className="h-4 w-80 bg-white/5 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#141416] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/5" />
              <div className="h-4 w-28 bg-white/5 rounded" />
            </div>
            <div className="h-8 w-16 bg-white/5 rounded" />
            <div className="h-3 w-24 bg-white/5 rounded mt-1" />
          </div>
        ))}
      </div>

      <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
        <div className="h-5 w-40 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="h-3 w-24 bg-white/5 rounded" />
                <div className="h-3 w-8 bg-white/5 rounded" />
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/5 rounded-full" style={{ width: `${100 - i * 15}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
        <div className="h-5 w-36 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
