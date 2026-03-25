export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        {/* Price and Category */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-gray-300 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  );
}