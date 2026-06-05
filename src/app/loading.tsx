export default function Loading() {
  return (
    <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
      </div>
    </main>
  );
}
