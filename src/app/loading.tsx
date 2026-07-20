import dynamic from "next/dynamic";

const GaugeLogo3D = dynamic(() => import("@/components/gauge-logo-3d"), {
  ssr: false,
});

export default function Loading() {
  // Branded 3D loading state — shown automatically by Next.js during route
  // transitions (App Router mounts loading.tsx while the destination page's
  // server components fetch). The hexagonal Gauge logo rotates + floats in
  // 3D on the app's charcoal surface so the handoff feels seamless.
  return (
    <main className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-6 p-6">
      <GaugeLogo3D size={180} />
      <div className="text-center">
        <p className="text-[15px] font-medium text-white/90 tracking-tight">
          Gauge
        </p>
        <p className="text-[12px] font-mono text-white/40 mt-1">
          Loading your workspace...
        </p>
      </div>
    </main>
  );
}
