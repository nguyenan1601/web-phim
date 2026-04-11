import { getPhimTheoQuocGia } from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import Pagination from "@/components/movie/Pagination";
import { Globe } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 86400;

const QUOC_GIA_TITLES: Record<string, string> = {
  "trung-quoc": "Trung Quốc",
  "han-quoc": "Hàn Quốc",
  "nhat-ban": "Nhật Bản",
  "thai-lan": "Thái Lan",
  "au-my": "Âu Mỹ",
  "dai-loan": "Đài Loan",
  "hong-kong": "Hồng Kông",
  "an-do": "Ấn Độ",
  "anh": "Anh",
  "phap": "Pháp",
  "duc": "Đức",
  "brazil": "Brazil",
  "viet-nam": "Việt Nam",
  "philippines": "Philippines",
  "indonesia": "Indonesia",
  "quoc-gia-khac": "Quốc Gia Khác",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const title = QUOC_GIA_TITLES[slug] || slug;
  return {
    title: `Phim ${title} | XemPhim`,
    description: `Xem phim ${title} - Phim hay chất lượng cao.`,
  };
}

export default async function QuocGiaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const data = await getPhimTheoQuocGia(slug, page);
  if (!data || !data.items) return notFound();

  const title = QUOC_GIA_TITLES[slug] || slug;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            Quốc gia: {title}
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
        baseUrl={`/quoc-gia/${slug}`}
      />
    </div>
  );
}
