import { getPhimDetail } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Clock, Globe, Star, User, Tag } from "lucide-react";
import EpisodeList from "@/components/movie/EpisodeList";
import FavoriteButton from "@/components/movie/FavoriteButton";
import RelatedMovies from "@/components/movie/RelatedMovies";
import { checkIsFavoriteAction } from "@/app/actions/favorites";
import type { Metadata } from "next";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tap?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tap } = await searchParams;
  const data = await getPhimDetail(slug);
  if (!data?.movie) return { title: "Phim Không Tìm Thấy" };
  
  const movie = data.movie;
  const epName = tap ? `Tập ${tap.replace("tap-", "")}` : "";
  const title = epName ? `${movie.name} - ${epName}` : movie.name;

  return {
    title: title,
    description: movie.description?.slice(0, 160) || `Xem phim ${movie.name} chất lượng cao.`,
    openGraph: {
      title: title,
      description: movie.description?.slice(0, 160),
      images: [movie.poster_url],
    },
  };
}

export default async function PhimDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPhimDetail(slug);
  if (!data?.movie) return notFound();

  const film = data.movie;
  const isFavorite = await checkIsFavoriteAction(slug);
  const { category, episodes } = film;

  // Extract genre & country from category (keys are numbered: "1", "2", "3", "4")
  let genres: { id: string; name: string }[] = [];
  let countries: { id: string; name: string }[] = [];

  if (category) {
    for (const key of Object.keys(category)) {
      const group = category[key];
      const groupName = group.group.name.toLowerCase().trim();
      if (groupName === "thể loại") genres = group.list;
      if (groupName === "quốc gia") countries = group.list;
    }
  }

  const primaryGenreSlug = genres.length > 0 ? genres[0].id : "";

  return (
    <div className="min-h-screen pb-16">
      {/* Backdrop Hero */}
      <div className="relative w-full h-[50vh] md:h-[65vh]">
        <div className="absolute inset-0 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={film.poster_url}
            alt={film.name}
            className="w-full h-full object-cover opacity-30 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>
      </div>

      {/* Content — overlaps the backdrop */}
      <div className="container mx-auto px-4 -mt-60 md:-mt-72 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-48 md:w-64">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-amber-500/30 shadow-2xl shadow-amber-500/10">
              {film.thumb_url ? (
                <Image
                  src={film.thumb_url}
                  alt={film.name}
                  fill
                  className="object-cover"
                  sizes="256px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">No Image</div>
              )}
              {film.quality && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded uppercase tracking-wider">
                  {film.quality}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 pt-2">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
              {film.name}
            </h1>
            <p className="text-lg text-zinc-500 font-light">{film.original_name}</p>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              {film.time && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-white/5 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {film.time}
                </span>
              )}
              {film.language && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-white/5 text-zinc-300">
                  <Globe className="w-3.5 h-3.5 text-amber-400" /> {film.language}
                </span>
              )}
              {film.current_episode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                  <Play className="w-3.5 h-3.5" /> {film.current_episode}
                </span>
              )}
            </div>

            {/* Director & Cast */}
            <div className="space-y-2 text-sm text-zinc-400">
              {film.director && (
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><span className="text-zinc-300 font-medium">Đạo diễn:</span> {film.director}</span>
                </div>
              )}
              {film.casts && (
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><span className="text-zinc-300 font-medium">Diễn viên:</span> {film.casts}</span>
                </div>
              )}
            </div>

            {/* Genres & Country */}
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/the-loai/${g.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800/60 border border-white/5 text-xs text-zinc-300 hover:border-amber-500/30 hover:text-amber-400 transition-all"
                >
                  <Tag className="w-3 h-3" /> {g.name}
                </Link>
              ))}
              {countries.map((c) => (
                <Link
                  key={c.id}
                  href={`/quoc-gia/${c.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800/60 border border-white/5 text-xs text-zinc-300 hover:border-amber-500/30 hover:text-amber-400 transition-all"
                >
                  <Globe className="w-3 h-3" /> {c.name}
                </Link>
              ))}
            </div>

            {/* Description */}
            {film.description && (
              <div className="pt-2">
                <div 
                   className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/50 p-4 rounded-xl border border-white/5"
                   dangerouslySetInnerHTML={{ __html: film.description }}
                />
              </div>
            )}

            {/* Action Buttons */}
            {episodes && episodes.length > 0 && episodes[0].items.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={`/xem/${slug}?tap=${episodes[0].items[0].slug}&sv=0`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-500 text-black font-semibold hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Xem Phim Ngay
                </Link>

                <FavoriteButton 
                  movie={{
                    slug: slug,
                    name: film.name,
                    thumb_url: film.thumb_url
                  }} 
                  initialIsFavorite={isFavorite}
                  variant="full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Episodes Section */}
        {episodes && episodes.length > 0 && (
          <div className="mt-12">
            <EpisodeList episodes={episodes} filmSlug={slug} />
          </div>
        )}

        {/* Related Movies Section */}
        {primaryGenreSlug && (
          <div className="mt-16 border-t border-white/5 pt-12">
            <RelatedMovies categorySlug={primaryGenreSlug} currentMovieSlug={slug} />
          </div>
        )}
      </div>
    </div>
  );
}
