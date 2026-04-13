"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Film, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PhimItem } from "@/lib/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_VISIBLE_RESULTS = 8;
const LOAD_MORE_STEP = 8;

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PhimItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setVisibleCount(INITIAL_VISIBLE_RESULTS);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handler);
    }

    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setResults([]);
      setVisibleCount(INITIAL_VISIBLE_RESULTS);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
        setVisibleCount(INITIAL_VISIBLE_RESULTS);
      }
    } catch {
      console.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onInputChange = (value: string) => {
    setQuery(value);
    setVisibleCount(INITIAL_VISIBLE_RESULTS);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => handleSearch(value.trim()), 400);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const keyword = query.trim();

    if (keyword.length < 2) return;

    onClose();
    router.push(`/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleResultScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;

    if (isNearBottom && visibleCount < results.length) {
      setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, results.length));
    }
  };

  const visibleResults = results.slice(0, visibleCount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Tìm kiếm phim..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-base"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
          <button
            type="submit"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-colors"
          >
            Enter
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto" onScroll={handleResultScroll}>
          {query.length > 0 && query.length < 2 && (
            <div className="px-5 py-8 text-center text-zinc-500 text-sm">
              Nhập ít nhất 2 ký tự để tìm kiếm...
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="px-5 py-8 text-center text-zinc-500 text-sm">
              <Film className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              Không tìm thấy phim nào cho &quot;{query}&quot;
            </div>
          )}

          {visibleResults.length > 0 && (
            <div className="py-2">
              {visibleResults.map((movie) => (
                <Link
                  key={movie.slug}
                  href={`/phim/${movie.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors group"
                >
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/5">
                    {movie.thumb_url ? (
                      <Image
                        src={movie.thumb_url}
                        alt={movie.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                      {movie.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {movie.original_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {movie.quality && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                          {movie.quality}
                        </span>
                      )}
                      {movie.current_episode && (
                        <span className="text-[10px] text-zinc-500">
                          {movie.current_episode}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {visibleCount < results.length && (
                <div className="px-5 py-4 text-center text-xs text-zinc-500">
                  Cuộn xuống để xem thêm kết quả
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/5 text-xs text-zinc-600 flex items-center justify-between">
          <span>Nhấn ESC để đóng</span>
          <span className="text-amber-500/50 flex items-center gap-1">
            <Search className="w-3 h-3" />
            Enter để xem tất cả kết quả
          </span>
        </div>
      </div>
    </div>
  );
}
