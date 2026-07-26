export default function AppLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-white/5 rounded" />
          <div className="h-4 w-72 bg-white/5 rounded" />
        </div>
        <div className="h-9 w-32 bg-white/5 rounded-full" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#141416] border border-white/5 rounded-2xl p-5">
            <div className="h-4 w-20 bg-white/5 rounded mb-3" />
            <div className="h-8 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-32 bg-white/5 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-28 bg-white/5 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
