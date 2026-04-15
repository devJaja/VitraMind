export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
      <p className="text-5xl">🌱</p>
      <h2 className="text-lg font-semibold text-white">Page not found</h2>
      <p className="text-sm text-gray-400">This page doesn&apos;t exist.</p>
      <a
        href="/"
        className="mt-2 text-sm text-green-400 hover:text-green-300 underline"
      >
        Back to home
      </a>
    </div>
  );
}
