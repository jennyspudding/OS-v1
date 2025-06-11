export default function CategoryIconSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center snap-start min-w-[72px] pt-2">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl md:w-16 md:h-16 mb-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
          <div className="w-12 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
        </div>
      ))}
    </>
  );
} 