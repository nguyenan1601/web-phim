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
      const delta = 2;
      const left = Math.max(2, currentPage - delta);
      const right = Math.min(totalPages - 1, currentPage + delta);

      pages.push(1);
      if (left > 2) pages.push("...");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    } else {
      // Fallback for when we don't know totalPages but have hasMore
      // Show current page and potential next pages
      const delta = 2;
      const start = Math.max(1, currentPage - delta);
      // We don't know the end, so we show up to current + delta if hasMore is true
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
    <div className="flex items-center justify-center gap-1.5 pt-10">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="p-2.5 rounded-lg bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className="p-2.5 rounded-lg bg-zinc-900/30 text-zinc-700 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Page Numbers */}
      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-zinc-600 text-sm select-none">
            ···
          </span>
        ) : (
          <Link
            key={page}
            href={pageUrl(page)}
            className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
              page === currentPage
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                : "bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30"
            }`}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {hasMore || (totalPages > 0 && currentPage < totalPages) ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="p-2.5 rounded-lg bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="p-2.5 rounded-lg bg-zinc-900/30 text-zinc-700 cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
