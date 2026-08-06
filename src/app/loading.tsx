import GaugeLogo from "@/components/gauge-logo";

export default function Loading() {
  return (
    <main id="main" className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4">
      <GaugeLogo size={64} />
      <p className="text-sm text-neutral-500 tracking-wide">Loading...</p>
    </main>
  );
}
