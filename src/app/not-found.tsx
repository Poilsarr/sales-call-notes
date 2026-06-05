import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#EFEFEF] text-gray-900 flex items-center justify-center px-5">
      <div className="doppel-outer max-w-md w-full">
        <div className="doppel-inner p-10 text-center">
          <span className="inline-block text-5xl font-medium tracking-tight mb-4">404</span>
          <h1 className="text-xl font-medium tracking-tight mb-2">Page not found</h1>
          <p className="text-sm text-gray-500 mb-8">The page you are looking for does not exist or has been moved.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full px-6 py-3 transition-colors duration-300"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
