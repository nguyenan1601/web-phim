import Link from "next/link";
import { getPhimMoi } from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import ContinueWatching from "@/components/home/ContinueWatching";
import { Sparkles, Play } from "lucide-react";

// Ép NextJS validate lại nội dung nếu đây là trang tĩnh
export const revalidate = 3600;

export default async function Home() {
  // Fetch 2 pages to have enough items for a full grid
  const [page1, page2] = await Promise.all([getPhimMoi(1), getPhimMoi(2)]);
  const phimMoi = [...(page1?.items || []), ...(page2?.items || [])];
  
  // Lấy 1 phim làm bộ phim nổi bật (Hero section)
  const heroMovie = phimMoi.length > 0 ? phimMoi[0] : null;
  // Lấy 15 phim (3 hàng × 5 cột) để grid luôn đầy
  const gridMovies = phimMoi.slice(1, 16);

  return (
    <div className="flex flex-col flex-1 pb-16 overflow-x-hidden">
      {/* Hero Section */}
      {heroMovie && (
        <div className="relative w-full h-[65vh] md:h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={heroMovie.poster_url} 
              alt={heroMovie.name}
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover opacity-40 blur-[4px] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          </div>
          
          <div className="container relative mx-auto px-4 z-10 pt-16">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <span>NỔI BẬT HÔM NAY</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white shadow-sm font-display leading-[1.1]">
                {heroMovie.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-zinc-300 font-medium">
                <span className="text-zinc-400">{heroMovie.time}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span className="text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{heroMovie.quality}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">{heroMovie.language}</span>
              </div>
              
              <div 
                className="text-base text-zinc-400 line-clamp-3 font-light leading-relaxed max-w-2xl bg-black/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm"
                dangerouslySetInnerHTML={{ __html: heroMovie.description || "" }}
              />
              
              <div className="flex items-center gap-4 pt-6">
                <Link href={`/phim/${heroMovie.slug}`} className="px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-white/10">
                  <Play className="w-5 h-5 fill-black" />
                  Bắt Đầu Xem
                </Link>
              </div>
            </div>
          </div>
        </div>
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
          <Link href="/danh-sach/phim-moi" className="text-sm text-zinc-400 hover:text-amber-400 transition-colors font-medium">
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

