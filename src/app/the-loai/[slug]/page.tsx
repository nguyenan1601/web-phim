import { getPhimTheoTheLoai } from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import Pagination from "@/components/movie/Pagination";
import { Tag } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 86400;

const THE_LOAI_TITLES: Record<string, string> = {
  "hanh-dong": "Hành Động",
  "tinh-cam": "Tình Cảm",
  "phim-hai": "Hài Hước",
  "co-trang": "Cổ Trang",
  "tam-ly": "Tâm Lý",
  "hinh-su": "Hình Sự",
  "chien-tranh": "Chiến Tranh",
  "the-thao": "Thể Thao",
  "vo-thuat": "Võ Thuật",
  "khoa-hoc-vien-tuong": "Khoa Học Viễn Tưởng",
  "phieu-luu": "Phiêu Lưu",
  "gia-tuong": "Giả Tưởng",
  "kinh-di": "Kinh Dị",
  "phim-nhac": "Âm Nhạc",
  "than-thoai": "Thần Thoại",
  "tai-lieu": "Tài Liệu",
  "gia-dinh": "Gia Đình",
  "chinh-kich": "Chính Kịch",
  "bi-an": "Bí Ẩn",
  "hoc-duong": "Học Đường",
  "kinh-dien": "Kinh Điển",
  "hoat-hinh": "Hoạt Hình",
  "phim-18": "Phim 18+",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const title = THE_LOAI_TITLES[slug] || slug;
  return {
    title: `Thể loại ${title}`,
    description: `Xem phim thể loại ${title} - Tuyển tập phim hay nhất.`,
  };
}

export default async function TheLoaiPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const data = await getPhimTheoTheLoai(slug, page);
  if (!data || !data.items) return notFound();

  const title = THE_LOAI_TITLES[slug] || slug;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            Thể loại: {title}
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">
          Trang {page} / {data.paginate.total_page} · Tổng {data.paginate.total_items} phim
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {data.items.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={data.paginate.total_page}
        baseUrl={`/the-loai/${slug}`}
      />
    </div>
  );
}
