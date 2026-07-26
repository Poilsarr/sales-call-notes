export default function RecordLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-40 bg-white/5 rounded mb-2" />
        <div className="h-4 w-64 bg-white/5 rounded" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#141416] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/5 mb-6" />
            <div className="h-7 w-32 bg-white/5 rounded mb-6" />
            <div className="h-11 w-40 bg-white/5 rounded-full" />
            <div className="h-3 w-72 bg-white/5 rounded mt-4" />
          </div>

          <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
            <div className="h-5 w-32 bg-white/5 rounded mb-4" />
            <div className="h-32 w-full bg-white/5 rounded-xl mb-4" />
            <div className="h-4 w-48 bg-white/5 rounded" />
          </div>
        </div>

        <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
          <div className="h-5 w-40 bg-white/5 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
