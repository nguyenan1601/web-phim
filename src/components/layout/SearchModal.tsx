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
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = query.trim();

    if (keyword.length < 2) return;

    onClose();
    router.push(`/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleResultScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;

    if (isNearBottom && visibleCount < results.length) {
      setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, results.length));
    }
  };

  const visibleResults = results.slice(0, visibleCount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] sm:pt-[10vh]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-3 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200 sm:mx-4 sm:max-h-[80vh]">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-b border-white/5 px-4 py-4 sm:px-5"
        >
          <Search className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Tìm kiếm phim..."
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
          <button
            type="submit"
            className="hidden items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-amber-400 sm:inline-flex"
          >
            Enter
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto" onScroll={handleResultScroll}>
          {query.length > 0 && query.length < 2 && (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">
              Nhập ít nhất 2 ký tự để tìm kiếm...
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">
              <Film className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
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
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 sm:gap-4 sm:px-5"
                >
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-white/5 bg-zinc-800">
                    {movie.thumb_url ? (
                      <Image
                        src={movie.thumb_url}
                        alt={movie.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <Film className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-amber-400">
                      {movie.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{movie.original_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {movie.quality && (
                        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                          {movie.quality}
                        </span>
                      )}
                      {movie.current_episode && (
                        <span className="text-[10px] text-zinc-500">{movie.current_episode}</span>
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

        <div className="flex flex-col gap-2 border-t border-white/5 px-4 py-3 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>Nhấn ESC để đóng</span>
          <span className="flex items-center gap-1 text-amber-500/50">
            <Search className="h-3 w-3" />
            Enter để xem tất cả kết quả
          </span>
        </div>
      </div>
    </div>
  );
}
