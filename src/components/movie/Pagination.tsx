"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  hasMore?: boolean;
  baseUrl: string;
}

export default function Pagination({
  currentPage,
  totalPages = 0,
  hasMore = false,
  baseUrl,
}: PaginationProps) {
  // If no total pages and no hasMore, or only 1 page and no more, don't show
  if ((totalPages <= 1 && !hasMore) && (currentPage <= 1)) return null;

  // Build visible page numbers with ellipsis logic
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    
    if (totalPages > 0) {
      const delta = 3; // Show more surrounding pages (e.g. 1 2 3 4 ... 30)
      const left = Math.max(2, currentPage - delta);
      const right = Math.min(totalPages - 1, currentPage + delta);

      pages.push(1);
      if (left > 2) pages.push("...");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    } else {
      // Fallback for when we don't know totalPages but have hasMore
      const delta = 3;
      const start = Math.max(1, currentPage - delta);
      const end = hasMore ? currentPage + delta : currentPage;
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (hasMore) pages.push("...");
    }

    return pages;
  };

  const pageUrl = (page: number) => {
    const [path, queryString] = baseUrl.split("?");
    const params = new URLSearchParams(queryString);
    params.set("page", String(page));
    return `${path}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-10">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
          title="Trang trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      ) : (
        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/40 text-zinc-700 cursor-not-allowed border border-white/5">
          <ChevronLeft className="w-5 h-5" />
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="w-8 text-center text-zinc-600 font-bold tracking-widest select-none">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={pageUrl(page)}
              className={`min-w-[40px] h-10 px-3 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                page === currentPage
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-105 z-10"
                  : "bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30 hover:bg-zinc-800"
              }`}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {hasMore || (totalPages > 0 && currentPage < totalPages) ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
          title="Trang sau"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/40 text-zinc-700 cursor-not-allowed border border-white/5">
          <ChevronRight className="w-5 h-5" />
        </span>
      )}
    </div>
  );
}
