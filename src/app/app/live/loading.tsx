export default function LiveLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-white/5 rounded" />
          <div className="h-8 w-64 bg-white/5 rounded" />
          <div className="h-4 w-80 bg-white/5 rounded" />
        </div>
        <div className="h-7 w-24 bg-white/5 rounded-full" />
      </div>

      <div className="bg-[#141416] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 mb-6" />
        <div className="h-7 w-32 bg-white/5 rounded mb-2" />
        <div className="h-3 w-64 bg-white/5 rounded mb-6" />
        <div className="h-11 w-40 bg-white/5 rounded-full" />
      </div>

      <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-white/5 rounded" />
            <div className="h-5 w-40 bg-white/5 rounded" />
            <div className="h-3 w-56 bg-white/5 rounded" />
          </div>
          <div className="h-9 w-36 bg-white/5 rounded-full" />
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-1">
          <div className="h-[420px] w-full bg-white/5 rounded-2xl" />
        </div>
      </div>

      <div className="bg-[#141416] border border-white/5 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/5 rounded" />
            <div className="h-3 w-full bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
