"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, XCircle, ChevronRight, AlertCircle } from "lucide-react";
import { deleteHistoryAction, clearAllHistoryAction } from "@/app/actions/history";
import { getLocalHistory, removeLocalHistory, clearLocalHistory } from "@/lib/localHistory";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryItem {
  id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  episode_slug: string;
  episode_name: string;
  progress_seconds: number;
  total_seconds: number;
  updated_at: string;
}

export default function HistoryClient({ initialHistory, userId }: { initialHistory: HistoryItem[]; userId?: string }) {
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [isPending, startTransition] = useTransition();

  // Guest: load from localStorage if server returned empty
  useEffect(() => {
    if (!userId && initialHistory.length === 0) {
      const local = getLocalHistory();
      if (local.length > 0) {
        startTransition(() => {
          setHistory(local as HistoryItem[]);
        });
      }
    }
  }, [initialHistory, userId]);

  const handleDelete = async (slug: string, name: string) => {
    const prevHistory = [...history];
    setHistory(history.filter(item => item.movie_slug !== slug));

    if (userId) {
      // Logged-in user: delete from DB
      const result = await deleteHistoryAction(slug);
      if (result.error) {
        setHistory(prevHistory);
        toast.error(result.error);
        return;
      }
    } else {
      // Guest: delete from localStorage
      removeLocalHistory(slug);
    }
    toast.info(`Đã xóa "${name}" khỏi lịch sử`);
  };

  const handleClearAll = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem phim không?")) return;

    const prevHistory = [...history];
    setHistory([]);

    if (userId) {
      // Logged-in user: clear from DB
      const result = await clearAllHistoryAction();
      if (result.error) {
        setHistory(prevHistory);
        toast.error(result.error);
        return;
      }
    } else {
      // Guest: clear localStorage
      clearLocalHistory();
    }
    toast.success("Đã xóa sạch lịch sử xem phim");
  };

  if (history.length === 0) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed p-8">
        <AlertCircle className="w-12 h-12 text-zinc-700 mb-4" />
        <p className="text-zinc-500 text-lg mb-6 text-center">Lịch sử xem phim của bạn đang trống.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-medium"
        >
          Khám phá phim ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleClearAll}
          className="text-sm text-zinc-500 hover:text-rose-500 flex items-center gap-2 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Xóa toàn bộ lịch sử
        </button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {history.map((item) => {
            const progress = item.total_seconds > 0
              ? Math.min((item.progress_seconds / item.total_seconds) * 100, 100)
              : 0;
            const isFinished = progress > 95;

            return (
              <motion.div
                key={item.movie_slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-zinc-900/40 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all hover:bg-zinc-900/60"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-lg group-hover:shadow-amber-500/10 transition-all">
                  {item.movie_thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.movie_thumb} 
                      alt={item.movie_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div 
                      className="h-full bg-amber-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {item.movie_name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                    <span className="text-sm text-amber-500 font-medium">Tập {item.episode_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                    <span>Cập nhật: {new Date(item.updated_at).toLocaleDateString('vi-VN')}</span>
                    {isFinished ? (
                        <span className="text-green-500 font-medium">Đã xem hết</span>
                    ) : item.total_seconds > 0 ? (
                        <span>Tiến độ: {Math.floor(item.progress_seconds / 60)} phút</span>
                    ) : (
                        <span>Đang xem</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${progress}%` }}
                       className={`h-full rounded-full ${isFinished ? 'bg-green-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Link
                    href={`/xem/${item.movie_slug}?tap=${item.episode_slug}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black text-sm font-semibold transition-all group-hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {isFinished ? "Xem lại" : "Tiếp tục"}
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(item.movie_slug, item.movie_name)}
                    className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                    title="Xóa khỏi lịch sử"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
