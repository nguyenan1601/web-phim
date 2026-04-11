"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  movie: {
    slug: string;
    name: string;
    thumb_url: string;
  };
  initialIsFavorite?: boolean;
  className?: string;
  variant?: "icon" | "full";
}

export default function FavoriteButton({
  movie,
  initialIsFavorite = false,
  className,
  variant = "icon",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic Update
    setIsFavorite(!isFavorite);

    startTransition(async () => {
      const result = await toggleFavoriteAction(movie);
      
      if (result.error) {
        // Revert on error
        setIsFavorite(isFavorite);
        toast.error(result.error);
      } else {
        if (result.action === "added") {
          toast.success(`Đã thêm "${movie.name}" vào yêu thích`);
        } else {
          toast.info(`Đã xóa "${movie.name}" khỏi yêu thích`);
        }
      }
    });
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300",
          isFavorite
            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
            : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
          isPending && "opacity-70 cursor-not-allowed",
          className
        )}
      >
        <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
        {isFavorite ? "Đã yêu thích" : "Thêm vào yêu thích"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "relative p-2 rounded-full backdrop-blur-md transition-all duration-300 group/fav",
        isFavorite
          ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
          : "bg-black/40 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white",
        isPending && "opacity-50",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? "active" : "inactive"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heart className={cn("w-5 h-5 transition-transform group-hover/fav:scale-110", isFavorite && "fill-current")} />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
