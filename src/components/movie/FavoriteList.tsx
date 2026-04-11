"use client";

import { useState } from "react";
import MovieCard from "./MovieCard";
import { removeFavoriteAction } from "@/app/actions/favorites";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FavoriteListProps {
  initialFavorites: any[];
}

export default function FavoriteList({ initialFavorites }: FavoriteListProps) {
  const [favorites, setFavorites] = useState(initialFavorites);

  const handleRemove = async (slug: string) => {
    // Optimistic Update
    const movieToRemove = favorites.find(f => f.movie_slug === slug);
    setFavorites(prev => prev.filter(f => f.movie_slug !== slug));

    try {
      const result = await removeFavoriteAction(slug);
      if (result.error) {
        // Revert on error
        if (movieToRemove) setFavorites(prev => [movieToRemove, ...prev]);
        toast.error("Không thể xóa phim: " + result.error);
      } else {
        toast.success("Đã xóa khỏi danh sách yêu thích");
      }
    } catch (error) {
      if (movieToRemove) setFavorites(prev => [movieToRemove, ...prev]);
      toast.error("Đã xảy ra lỗi khi xóa phim");
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed p-8">
        <p className="text-zinc-500 text-lg mb-6">Bạn chưa yêu thích bộ phim nào.</p>
        <a
          href="/"
          className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-medium"
        >
          Khám phá phim ngay
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <AnimatePresence mode="popLayout">
        {favorites.map((fav) => (
          <motion.div
            key={fav.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          >
            <MovieCard
              movie={{
                slug: fav.movie_slug,
                name: fav.movie_name,
                thumb_url: fav.movie_thumb,
                original_name: "", 
                quality: "HD",
                current_episode: "Full",
              } as any}
              onRemove={handleRemove}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
