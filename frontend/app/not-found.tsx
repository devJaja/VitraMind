import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="text-5xl">🌱</p>
      <h2 className="text-xl font-bold text-white">Page not found</h2>
      <p className="text-sm text-gray-500">This path doesn&apos;t exist in your growth journey.</p>
      <Link href="/" className="text-sm bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-full transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
