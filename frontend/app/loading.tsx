export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-2xl h-20" />
        ))}
      </div>
      {/* Form skeleton */}
      <div className="bg-gray-900 rounded-2xl h-64 border border-gray-800" />
    </div>
  );
}
