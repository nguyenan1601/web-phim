export default function MovieSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full rounded-xl bg-zinc-900 animate-pulse border border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <MovieSkeleton key={i} />
      ))}
    </div>
  );
}
