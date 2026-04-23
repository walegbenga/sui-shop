export default function ProductCardSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-in"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Image skeleton */}
      <div className="skeleton w-full h-48" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}
