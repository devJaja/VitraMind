"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2 rounded-full text-sm transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
