import Link from "next/link";
import { Film, Search } from "lucide-react";
import MovieCard from "@/components/ui/movie/MovieCard";
import ListingFilters from "@/components/ui/movie/ListingFilters";
import Pagination from "@/components/ui/movie/Pagination";
import { getPhimByAdvancedFiltersPage } from "@/lib/api";

interface FilterPageProps {
  searchParams: Promise<{
    "danh-sach"?: string;
    "the-loai"?: string;
    "quoc-gia"?: string;
    nam?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 10;

export const revalidate = 1800;

export async function generateMetadata({ searchParams }: FilterPageProps) {
  const params = await searchParams;
  const hasAnyFilter =
    Boolean(params["danh-sach"]) ||
    Boolean(params["the-loai"]) ||
    Boolean(params["quoc-gia"]) ||
    Boolean(params.nam);

  return {
    title: hasAnyFilter
      ? "Kết quả lọc phim | XemPhim"
      : "Lọc phim nâng cao | XemPhim",
    description:
      "Tìm phim theo nhiều tiêu chí kết hợp: danh sách, thể loại, quốc gia và năm.",
  };
}

function buildPageHref(params: {
  categorySlug: string;
  genreSlugs: string[];
  countrySlug: string;
  year: string;
}) {
  const query = new URLSearchParams();

  if (params.categorySlug) {
    query.set("danh-sach", params.categorySlug);
  }

  if (params.genreSlugs.length > 0) {
    query.set("the-loai", params.genreSlugs.join(","));
  }

  if (params.countrySlug) {
    query.set("quoc-gia", params.countrySlug);
  }

  if (params.year) {
    query.set("nam", params.year);
  }

  const queryString = query.toString();
  return queryString ? `/loc?${queryString}` : "/loc";
}

export default async function AdvancedFilterPage({
  searchParams,
}: FilterPageProps) {
  const params = await searchParams;
  const categorySlug = params["danh-sach"]?.trim() || "";
  const genreSlugs = (params["the-loai"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const countrySlug = params["quoc-gia"]?.trim() || "";
  const year = params.nam?.trim() || "";
  const currentPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const hasAnyFilter = Boolean(
    categorySlug || genreSlugs.length > 0 || countrySlug || year,
  );

  const result = hasAnyFilter
    ? await getPhimByAdvancedFiltersPage(
        {
          categorySlug: categorySlug || undefined,
          genreSlugs: genreSlugs.length > 0 ? genreSlugs : undefined,
          countrySlug: countrySlug || undefined,
          year: year || undefined,
        },
        currentPage,
        PAGE_SIZE,
      )
    : { items: [], hasMore: false };

  const paginationBaseUrl = buildPageHref({
    categorySlug,
    genreSlugs,
    countrySlug,
    year,
  });

  return (
    <div className="container mx-auto min-h-screen px-4 pb-16 pt-24">
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-amber-400" />
          <h1 className="text-3xl font-display font-bold text-white md:text-4xl">
            Lọc phim theo nhiều tiêu chí
          </h1>
        </div>

        <p className="text-sm text-zinc-500">
          Chọn danh sách phim, thể loại, quốc gia, năm rồi bấm{" "}
          <span className="font-medium text-amber-400">Tìm kiếm bộ lọc</span>.
        </p>
      </div>

      <ListingFilters
        currentCategory={categorySlug}
        currentGenres={genreSlugs}
        currentCountry={countrySlug}
        currentYear={year}
      />

      {hasAnyFilter ? (
        result.items.length > 0 ? (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-5">
              {result.items.map((movie) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={
                result.totalItems ? Math.ceil(result.totalItems / 10) : 0
              }
              hasMore={result.hasMore}
              baseUrl={paginationBaseUrl}
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <Film className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="text-base font-semibold text-white">
              Không có phim phù hợp với tổ hợp bộ lọc này.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Hãy thử đổi bớt một tiêu chí hoặc chọn năm/quốc gia khác.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <Film className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-base font-semibold text-white">
            Chưa có tiêu chí lọc.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Chọn ít nhất một điều kiện ở bộ lọc phía trên để bắt đầu.
          </p>
        </div>
      )}
    </div>
  );
}
