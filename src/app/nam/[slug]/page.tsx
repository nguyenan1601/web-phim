import { getPhimTheoNam } from "@/lib/api";
import MovieCard from "@/components/ui/movie/MovieCard";
import ListingFilters from "@/components/ui/movie/ListingFilters";
import Pagination from "@/components/ui/movie/Pagination";
import { Calendar } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Phim phát hành năm ${slug}`,
    description: `Danh sách phim hay phát hành năm ${slug}. Xem phim chất lượng cao miễn phí.`,
  };
}

export default async function NamPhimPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const data = await getPhimTheoNam(slug, page);
  if (!data || !data.items) return notFound();

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            Năm phát hành: {slug}
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">
          Trang {page} / {data.paginate.total_page} · Tổng{" "}
          {data.paginate.total_items} phim
        </p>
      </div>

      <ListingFilters currentYear={slug} />

      {data.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {data.items.map((movie) => (
            <MovieCard key={movie.slug} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-zinc-400">
            Không tìm thấy phim nào phát hành trong năm này.
          </p>
        </div>
      )}

      {data.paginate.total_page > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.paginate.total_page}
          baseUrl={`/nam/${slug}`}
        />
      )}
    </div>
  );
}
