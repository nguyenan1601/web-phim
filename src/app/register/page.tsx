import { signup } from "@/app/auth/actions";
import { Popcorn, Mail, Lock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RegisterPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.05)_0%,rgba(0,0,0,1)_70%)]">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white font-bold text-3xl tracking-tight mb-4"
          >
            <Popcorn className="w-8 h-8 text-amber-400" />
            <span className="font-display">
              NV.<span className="font-light">Movies</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-semibold text-white">Tạo tài khoản mới</h1>
          <p className="text-zinc-500 text-sm">Tham gia cùng cộng đồng XemPhim ngay hôm nay</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center">
            {message}
          </div>
        )}

        {/* Form Container */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <form className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Họ và tên</label>
              <div className="relative group/field">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/field:text-amber-400 transition-colors" />
                <input
                  name="full_name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full bg-zinc-800/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
              <div className="relative group/field">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/field:text-amber-400 transition-colors" />
                <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="w-full bg-zinc-800/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Mật khẩu</label>
              <div className="relative group/field">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/field:text-amber-400 transition-colors" />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-zinc-800/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                formAction={signup}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3.5 rounded-xl transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-500">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Đăng nhập tại đây
            </Link>
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Trở về Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
