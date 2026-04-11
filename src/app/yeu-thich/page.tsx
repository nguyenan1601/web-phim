import { getFavoritesAction } from "@/app/actions/favorites";
import { Heart, Home } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import FavoriteList from "@/components/movie/FavoriteList";

export const metadata = {
  title: "Phim Yêu Thích | XemPhim",
  description: "Danh sách phim yêu thích của bạn.",
};

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Heart className="w-16 h-16 text-zinc-800 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Vui lòng đăng nhập</h1>
        <p className="text-zinc-500 mb-8 max-w-md text-center">
          Bạn cần đăng nhập để xem danh sách phim yêu thích của mình.
        </p>
        <Link
          href="/login"
          className="px-8 py-3 bg-amber-500 text-black font-semibold rounded-full hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const favorites = await getFavoritesAction();

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            Phim Yêu Thích
          </h1>
          <p className="text-zinc-500 mt-1">Danh sách các phim bạn đã lưu lại</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>

      <FavoriteList initialFavorites={favorites} />
    </div>
  );
}
