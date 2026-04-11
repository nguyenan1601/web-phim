import { MovieGridSkeleton } from "@/components/movie/MovieSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 pb-16">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[65vh] md:h-[80vh] bg-zinc-900 border-b border-white/5 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <div className="w-32 h-6 bg-zinc-800 rounded-full" />
            <div className="w-full h-16 bg-zinc-800 rounded-xl" />
            <div className="w-3/4 h-6 bg-zinc-800 rounded-lg" />
            <div className="w-48 h-12 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="container mx-auto px-4 mt-12 space-y-8">
        <div className="w-48 h-8 bg-zinc-900 rounded-lg" />
        <MovieGridSkeleton count={10} />
      </div>
    </div>
  );
}
