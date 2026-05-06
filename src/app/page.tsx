import Link from "next/link";
import { getPhimMoi, comparePhimItems } from "@/lib/api";
import MovieCard from "@/components/ui/movie/MovieCard";
import ContinueWatching from "@/components/home/ContinueWatching";
import { Play } from "lucide-react";

// Ép NextJS validate lại nội dung nếu đây là trang tĩnh
export const revalidate = 3600;

export default async function Home() {
  // Fetch 2 pages to have enough items for a full grid
  const [page1, page2] = await Promise.all([getPhimMoi(1), getPhimMoi(2)]);
  const phimMoi = [...(page1?.items || []), ...(page2?.items || [])].sort(
    comparePhimItems,
  );

  // Lấy 1 phim làm bộ phim nổi bật (Hero section)
  const heroMovie = phimMoi.length > 0 ? phimMoi[0] : null;
  // Lấy 15 phim (3 hàng × 5 cột) để grid luôn đầy
  const gridMovies = phimMoi.slice(1, 16);

  return (
    <div className="flex flex-col flex-1 pb-16 overflow-x-hidden">
      {/* Hero Section */}
      {heroMovie && (
        <section className="relative w-full min-h-[500px] sm:min-h-[560px] md:min-h-[640px] lg:min-h-[680px] flex items-end md:items-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroMovie.poster_url}
              alt={heroMovie.name}
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover object-center opacity-45 blur-[3px] scale-105 sm:opacity-40"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_0%,rgba(0,0,0,0.45)_38%,rgba(0,0,0,0.92)_78%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 md:via-black/70 to-black/35 md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/50" />
          </div>

          <div className="container relative mx-auto px-4 z-10 pt-24 pb-10 sm:pb-12 md:pt-16 md:pb-16">
            <div className="max-w-[min(100%,46rem)] space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.22)] backdrop-blur">
                <span>NỔI BẬT HÔM NAY</span>
              </div>

              <h1 className="text-[clamp(1.9rem,8vw,4.5rem)] font-extrabold tracking-[-0.025em] text-white shadow-sm font-display leading-[1.08] text-balance">
                {heroMovie.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-300 font-medium">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-zinc-200 border border-white/10 backdrop-blur-sm">
                  {heroMovie.time}
                </span>
                <span className="text-amber-300 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                  {heroMovie.quality}
                </span>
                <span className="text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                  {heroMovie.language}
                </span>
              </div>

              <div
                className="max-w-xl text-sm sm:text-base text-zinc-300/90 line-clamp-3 font-light leading-relaxed bg-black/30 p-3 sm:p-3.5 rounded-xl border border-white/10 shadow-2xl shadow-black/20 backdrop-blur-md"
                dangerouslySetInnerHTML={{
                  __html: heroMovie.description || "",
                }}
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 sm:pt-3">
                <Link
                  href={`/phim/${heroMovie.slug}`}
                  className="w-full sm:w-auto justify-center px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-amber-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-white/10"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Bắt Đầu Xem
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tiếp Tục Xem (Personal history) */}
      <ContinueWatching />

      {/* Danh Sách Phim Mới */}
      <div className="container mx-auto px-4 mt-8 md:mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-amber-500 rounded-full"></span>
            Mới Cập Nhật
          </h2>
          <Link
            href="/danh-sach/phim-moi"
            className="text-sm text-zinc-400 hover:text-amber-400 transition-colors font-medium"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-5">
          {gridMovies.map((movie) => (
            <MovieCard key={movie.slug} movie={movie} />
          ))}
        </div>
      </div>
    </div>
  );
}
