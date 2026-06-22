import { getPhimTheoTheLoai, getAllCategories } from "@/lib/api";
import MovieCard from "@/components/ui/movie/MovieCard";
import ListingFilters from "@/components/ui/movie/ListingFilters";
import Pagination from "@/components/ui/movie/Pagination";
import { Tag } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const categories = await getAllCategories();
  const category = categories.find((c) => c.slug === slug);
  const title = category?.name || slug;
  return {
    title: `Thể loại ${title}`,
    description: `Xem phim thể loại ${title} - Tuyển tập phim hay nhất.`,
  };
}

export default async function TheLoaiPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const [data, categories] = await Promise.all([
    getPhimTheoTheLoai(slug, page),
    getAllCategories(),
  ]);
  if (!data || !data.items) return notFound();

  const category = categories.find((c) => c.slug === slug);
  const title = category?.name || slug;

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
          Trang {page} / {data.paginate.total_page} · Tổng{" "}
          {data.paginate.total_items} phim
        </p>
      </div>

      <ListingFilters
        currentGenres={[slug]}
        genreOptions={categories.map((c) => ({ slug: c.slug, label: c.name }))}
      />

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
