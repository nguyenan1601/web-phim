import { getPhimTheoTheLoai } from "@/lib/api";
import MovieCard from "./MovieCard";
import { Sparkles } from "lucide-react";

interface RelatedMoviesProps {
  categorySlug: string;
  currentMovieSlug: string;
  title?: string;
}

export default async function RelatedMovies({
  categorySlug,
  currentMovieSlug,
  title = "Có Thể Bạn Cũng Thích",
}: RelatedMoviesProps) {
  const response = await getPhimTheoTheLoai(categorySlug, 1);
  
  if (!response || !response.items || response.items.length === 0) {
    return null;
  }

  // Filter out current movie and limit to 6
  const relatedMovies = response.items
    .filter((movie) => movie.slug !== currentMovieSlug)
    .slice(0, 6);

  if (relatedMovies.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {relatedMovies.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>
    </div>
  );
}
