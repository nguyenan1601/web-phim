import { getPhimDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import WatchClient from "@/components/movie/WatchClient";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tap?: string; sv?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tap } = await searchParams;
  const data = await getPhimDetail(slug);
  if (!data?.movie) return { title: "Xem Phim" };
  const epName = tap ? `Tập ${tap.replace("tap-", "")}` : "Tập 1";
  return {
    title: `${data.movie.name} - ${epName} | XemPhim`,
    description: `Xem ${data.movie.name} ${epName} chất lượng cao miễn phí.`,
  };
}

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tap, sv } = await searchParams;

  const data = await getPhimDetail(slug);
  if (!data?.movie || !data.movie.episodes?.length) return notFound();

  const film = data.movie;
  const { episodes } = film;
  const serverIdx = Math.min(parseInt(sv || "0", 10), episodes.length - 1);
  const currentServer = episodes[serverIdx];
  const currentEp = currentServer.items.find((e) => e.slug === tap) || currentServer.items[0];

  // Lấy lịch sử xem để khôi phục vị trí (initialTime)
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  
  let savedProgress = 0;
  if (user) {
    const { data: historyData } = await supabase
      .from("watch_history")
      .select("progress_seconds, episode_slug")
      .eq("user_id", user.id)
      .eq("movie_slug", slug)
      .single();
    
    // Chỉ khôi phục nếu đúng tập người dùng đã xem lần trước
    if (historyData && historyData.episode_slug === currentEp.slug) {
      savedProgress = historyData.progress_seconds;
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
          <Link href="/" className="hover:text-amber-400 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/phim/${slug}`} className="hover:text-amber-400 transition-colors truncate max-w-[200px]">
            {film.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-amber-400 font-medium">Tập {currentEp.name}</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3">
          <Link href={`/phim/${slug}`} className="p-2 rounded-lg bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white truncate">
            {film.name} <span className="text-amber-400">- Tập {currentEp.name}</span>
          </h1>
        </div>

        {/* Video Player — Client Component */}
        <WatchClient
          m3u8={currentEp.m3u8}
          embedUrl={currentEp.embed}
          poster={film.poster_url}
          episodes={episodes}
          filmSlug={slug}
          filmName={film.name}
          currentEpSlug={currentEp.slug}
          currentServerIdx={serverIdx}
          initialTime={savedProgress}
          userId={user?.id}
        />
      </div>
    </div>
  );
}
