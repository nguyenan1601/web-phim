import { getHistoryAction } from "@/app/actions/history";
import HistoryClient from "./HistoryClient";
import { History, Home } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const metadata = {
  title: "Lịch Sử Xem Phim | XemPhim",
  description: "Danh sách phim bạn đã từng xem.",
};

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();


  const history = await getHistoryAction();

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-blue-500" />
            Lịch Sử Xem Phim
          </h1>
          <p className="text-zinc-500 mt-1">Danh sách phim bạn đã xem gần đây</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>

      <HistoryClient initialHistory={history} />
    </div>
  );
}
