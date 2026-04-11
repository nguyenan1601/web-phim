import { MovieGridSkeleton } from "@/components/movie/MovieSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 space-y-8">
        {/* Title Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div className="space-y-4">
            <div className="w-48 h-8 bg-zinc-900 rounded-lg animate-pulse" />
            <div className="w-32 h-4 bg-zinc-900 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <MovieGridSkeleton count={20} />
      </div>
    </div>
  );
}
