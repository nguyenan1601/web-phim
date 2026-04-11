import { getPhimTheoDanhSach, getPhimMoi } from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import Pagination from "@/components/movie/Pagination";
import { Film } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 3600;

// Map slug to readable Vietnamese title
const DANH_SACH_TITLES: Record<string, string> = {
  "phim-moi": "Phim Mới Cập Nhật",
  "phim-moi-cap-nhat": "Phim Mới Cập Nhật",
  "phim-bo": "Phim Bộ",
  "phim-le": "Phim Lẻ",
  "phim-dang-chieu": "Phim Đang Chiếu",
  "phim-tron-bo": "Phim Trọn Bộ",
  "hoat-hinh": "Phim Hoạt Hình",
  "phim-vietsub": "Phim Vietsub",
  "phim-thuyet-minh": "Phim Thuyết Minh",
  "phim-long-tieng": "Phim Lồng Tiếng",
  "phim-bo-dang-chieu": "Phim Bộ Đang Chiếu",
  "phim-bo-hoan-thanh": "Phim Bộ Hoàn Thành",
  "phim-sap-chieu": "Phim Sắp Chiếu",
  "subteam": "Subteam",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = DANH_SACH_TITLES[slug] || "Danh Sách Phim";
  return {
    title: `${title} | XemPhim`,
    description: `Danh sách ${title} - Cập nhật liên tục, chất lượng cao.`,
  };
}

export default async function DanhSachPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  // Special case: "phim-moi" and "phim-moi-cap-nhat" uses the same API endpoint
  const data = (slug === "phim-moi" || slug === "phim-moi-cap-nhat")
    ? await getPhimMoi(page)
    : await getPhimTheoDanhSach(slug, page);
  if (!data || !data.items || data.items.length === 0) return notFound();

  const title = DANH_SACH_TITLES[slug] || slug;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Film className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            {title}
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">
          Trang {page} / {data.paginate.total_page} · Tổng {data.paginate.total_items} phim
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {data.items.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={data.paginate.total_page}
        baseUrl={`/danh-sach/${slug}`}
      />
    </div>
  );
}
