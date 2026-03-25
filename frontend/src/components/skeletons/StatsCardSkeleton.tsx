export default function StatsCardSkeleton() {
  return (
    <div className="bg-gray-100 rounded-lg shadow p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}