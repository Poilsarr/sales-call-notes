import dynamic from "next/dynamic";

const GaugeLogo3D = dynamic(() => import("@/components/gauge-logo-3d"), {
  ssr: false,
});

export default function Loading() {
  // Full-screen 3D Gauge logo — enlarged, centered, spinning weightlessly
  // on the app's charcoal surface. No text; the logo itself is the loader.
  // Next.js mounts this automatically during route transitions.
  return (
    <main className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <GaugeLogo3D size={340} />
    </main>
  );
}
