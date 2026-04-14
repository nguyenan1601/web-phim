import { getProfileAction } from "@/app/actions/profile";
import { getFavoritesAction } from "@/app/actions/favorites";
import { getHistoryAction } from "@/app/actions/history";
import ProfileForm from "./ProfileForm";
import { User, Heart, History, Calendar, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Trang Cá Nhân | XemPhim",
  description: "Quản lý thông tin cá nhân và xem thống kê của bạn.",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, favorites, history] = await Promise.all([
    getProfileAction(),
    getFavoritesAction(),
    getHistoryAction(),
  ]);

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <User className="w-6 h-6 text-amber-500" />
            </div>
            Trang Cá Nhân
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-amber-500 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-amber-500/20">
                {profile?.full_name?.[0] || user.email?.[0] || "U"}
              </div>
              <h2 className="text-xl font-bold text-white truncate px-2">
                {profile?.full_name || "Chưa đặt tên"}
              </h2>
              <p className="text-zinc-500 text-sm mt-1 truncate">{user.email}</p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-zinc-400 group-hover:text-amber-500 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Yêu thích</span>
                </div>
                <span className="text-white font-bold">{favorites.length}</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-zinc-400 group-hover:text-blue-500 transition-colors">
                  <History className="w-4 h-4" />
                  <span className="text-sm">Lịch sử xem</span>
                </div>
                <span className="text-white font-bold">{history.length}</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Ngày tham gia</span>
                </div>
                <span className="text-white font-bold text-xs">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-white mb-6">Thông tin cá nhân</h3>
              <ProfileForm profile={profile} email={user.email || ""} />
            </div>

            {/* <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-amber-500 mb-2">Ghi chú</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Tên đầy đủ của bạn sẽ được hiển thị trên hệ thống. 
                Sắp tới, chúng tôi sẽ cập nhật thêm tính năng thay đổi Avatar và Bình luận phim. 
                Hãy chú ý theo dõi nhé!
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
