"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers with ellipsis logic
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pageUrl = (page: number) => `${baseUrl}?page=${page}`;

  return (
    <div className="flex items-center justify-center gap-1.5 pt-10">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="p-2.5 rounded-lg bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
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
      {currentPage < totalPages ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="p-2.5 rounded-lg bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
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
