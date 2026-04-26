import Link from "next/link";
import { Search, Film } from "lucide-react";
import MovieCard from "@/components/ui/movie/MovieCard";
import Pagination from "@/components/ui/movie/Pagination";
import { searchPhimAdvanced } from "@/lib/search";

interface PageProps {
  searchParams: Promise<{ keyword?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { keyword } = await searchParams;
  const query = keyword?.trim() || "";

  if (!query) {
    return {
      title: "Tìm kiếm phim | XemPhim",
      description: "Tìm kiếm phim theo từ khóa trên XemPhim.",
    };
  }

  return {
    title: `Kết quả tìm kiếm cho "${query}" | XemPhim`,
    description: `Danh sách phim phù hợp với từ khóa ${query}.`,
  };
}

const PAGE_SIZE = 10;

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const keyword = params.keyword;
  const pageParam = params.page;

  const query = keyword?.trim() || "";
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const allItems = query.length >= 2 ? await searchPhimAdvanced(query) : [];
  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Slice items for current page
  const items = allItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 min-h-screen">
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            Tìm kiếm phim
          </h1>
        </div>

        {query.length >= 2 ? (
          <p className="text-zinc-500 text-sm">
            Từ khóa: <span className="text-zinc-200 font-medium">{query}</span>
            {" · "}
            Tìm thấy {totalItems} kết quả{" "}
            {totalItems > PAGE_SIZE && `(Trang ${currentPage}/${totalPages})`}
          </p>
        ) : (
          <p className="text-zinc-500 text-sm">
            Nhập ít nhất 2 ký tự để xem kết quả tìm kiếm.
          </p>
        )}
      </div>

      {query.length < 2 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <Film className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-400">Từ khóa quá ngắn để tìm kiếm.</p>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {items.map((movie) => (
              <MovieCard key={movie.slug} movie={movie} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/tim-kiem?keyword=${encodeURIComponent(query)}`}
          />

          <div className="text-sm text-zinc-500 text-center">
            Không thấy phim phù hợp?{" "}
            <Link
              href="/"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Quay về trang chủ
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <Film className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-300 font-medium">
            Không tìm thấy phim nào phù hợp.
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Thử lại với từ khóa ngắn hơn hoặc tên gốc của phim.
          </p>
        </div>
      )}
    </div>
  );
}
