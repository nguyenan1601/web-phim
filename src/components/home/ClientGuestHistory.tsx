"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, History as HistoryIcon, Trash2 } from "lucide-react";
import { getLocalHistory, removeLocalHistory } from "@/lib/localHistory";
import { getHistoryAction, deleteHistoryAction } from "@/app/actions/history";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  episode_slug: string;
  episode_name: string;
  progress_seconds: number;
  total_seconds: number;
  updated_at?: string;
}

interface Props {
  serverHistory?: HistoryItem[];
  userId?: string;
}

export default function ClientGuestHistory({ serverHistory = [], userId }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>(serverHistory.slice(0, 6));
  const pathname = usePathname();

  const refreshHistory = useCallback(async () => {
    if (userId) {
      // Logged-in user: always fetch fresh data from DB via server action
      const freshData = await getHistoryAction();
      setHistory((freshData || []).slice(0, 6));
    } else {
      // Guest: read from localStorage
      const local = getLocalHistory();
      setHistory(local.slice(0, 6) as HistoryItem[]);
    }
  }, [userId]);

  useEffect(() => {
    // Re-fetch when tab regains focus (covers: delete on /lich-su then navigate back)
    const handleFocus = () => refreshHistory();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshHistory();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname, refreshHistory]);

  const handleDelete = async (e: React.MouseEvent, movieSlug: string, movieName: string) => {
    e.preventDefault();
    e.stopPropagation();

    const prevHistory = [...history];
    setHistory(history.filter(item => item.movie_slug !== movieSlug));

    if (userId) {
      const result = await deleteHistoryAction(movieSlug);
      if (result.error) {
        setHistory(prevHistory);
        toast.error(result.error);
        return;
      }
    } else {
      removeLocalHistory(movieSlug);
    }
    toast.info(`Đã xóa "${movieName}" khỏi danh sách`);
  };

  if (history.length === 0) return null;

  return (
    <div className="container mx-auto px-4 mt-8 md:mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-white flex items-center gap-3">
          <HistoryIcon className="w-6 h-6 text-amber-500" />
          Tiếp Tục Xem
        </h2>
        <Link href="/lich-su" className="text-sm text-zinc-400 hover:text-amber-400 transition-colors">
          Xem lịch sử &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => {
          const progress = item.total_seconds > 0
            ? Math.min(Math.round((item.progress_seconds / item.total_seconds) * 100), 100)
            : null;

          return (
           <Link
             key={item.id || item.movie_slug}
             href={`/xem/${item.movie_slug}?tap=${item.episode_slug}`}
             className="group relative flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 hover:bg-zinc-900 transition-all overflow-hidden min-w-0"
           >
             {/* Delete button — always visible on touch, hover on desktop */}
             <button
               onClick={(e) => handleDelete(e, item.movie_slug, item.movie_name)}
               className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 p-1 sm:p-1.5 rounded-lg bg-black/60 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
               title="Xóa khỏi danh sách"
               aria-label={`Xóa ${item.movie_name} khỏi danh sách`}
             >
               <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
             </button>

             {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-24 sm:w-28 md:w-32 aspect-video rounded-lg overflow-hidden bg-zinc-800">
                {item.movie_thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={item.movie_thumb} 
                    alt={item.movie_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-amber-500 opacity-50" />
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                   <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-lg">
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                   </div>
                </div>
                
                {progress !== null && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div 
                      className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center py-1 overflow-hidden">
                <h3 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-amber-400 transition-colors">
                  {item.movie_name}
                </h3>
                <p className="text-zinc-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate">
                  Đang xem: <span className="text-zinc-300">Tập {item.episode_name || item.episode_slug.replace('tap-', '')}</span>
                </p>
                <p className="text-[11px] sm:text-xs text-amber-500/70 mt-1.5 sm:mt-2 font-medium">
                  {progress !== null ? `${progress}% hoàn thành` : 'Đang xem'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
