export default function ListItemSkeleton() {
  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-center animate-pulse">
        {/* Image */}
        <div className="h-20 w-20 bg-gray-300 rounded-lg"></div>
        
        {/* Content */}
        <div className="ml-4 flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="ml-4">
              <div className="h-6 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </li>
  );
}