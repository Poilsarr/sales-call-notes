export default function CallsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-white/5 rounded" />
          <div className="h-4 w-56 bg-white/5 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-white/5 rounded-full" />
          <div className="h-10 w-28 bg-white/5 rounded-full" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 flex-1 bg-white/5 rounded-xl" />
        <div className="h-12 w-12 bg-white/5 rounded-xl" />
      </div>

      <div className="flex items-center gap-1 border-b border-white/5 pb-0">
        <div className="h-9 w-20 bg-white/5 rounded-t-lg" />
        <div className="h-9 w-24 bg-white/5 rounded-t-lg" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#141416] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-white/5 rounded" />
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-7 w-20 bg-white/5 rounded-full" />
                <div className="h-7 w-24 bg-white/5 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
