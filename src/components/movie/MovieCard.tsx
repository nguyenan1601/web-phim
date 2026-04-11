import Image from "next/image";
import Link from "next/link";
import { PhimItem } from "@/lib/api";
import FavoriteButton from "./FavoriteButton";
import { X } from "lucide-react";

interface MovieCardProps {
  movie: PhimItem;
  onRemove?: (slug: string) => void;
}

export default function MovieCard({ movie, onRemove }: MovieCardProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) onRemove(movie.slug);
  };

  return (
    <Link href={`/phim/${movie.slug}`} className="group relative flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/5 transition-all duration-300 group-hover:border-amber-500/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:-translate-y-1">
        {movie.thumb_url ? (
          <Image
            src={movie.thumb_url}
            alt={movie.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        
        {/* Action Button: Remove (X) or Favorite (Heart) */}
        <div className="absolute top-2 left-2 z-10">
          {onRemove ? (
            <button
              onClick={handleRemove}
              className="p-2 rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border border-rose-400/20"
              title="Xóa khỏi yêu thích"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FavoriteButton movie={movie} />
            </div>
          )}
        </div>

        {/* Quality Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded shadow-lg uppercase tracking-wider">
          {movie.quality}
        </div>
        
        {/* Episode Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded border border-white/10">
          {movie.current_episode}
        </div>
      </div>
      
      {/* Title Info */}
      <div className="flex flex-col pt-1">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-amber-400 transition-colors text-sm">
          {movie.name}
        </h3>
        <p className="text-xs text-zinc-500 truncate font-light mt-0.5">{movie.original_name}</p>
      </div>
    </Link>
  );
}
