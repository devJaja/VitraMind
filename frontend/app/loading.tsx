export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-gray-900 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-2xl" />)}
      </div>
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-7 w-16 bg-gray-800 rounded-full" />)}
      </div>
      <div className="h-64 bg-gray-900 rounded-2xl" />
    </div>
  );
}
