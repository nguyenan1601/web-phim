"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Popcorn, Menu, X, ChevronDown, User as UserIcon, LogOut, Heart, History } from "lucide-react";
import SearchModal from "./SearchModal";
import { type User } from "@supabase/supabase-js";
import { signOut } from "@/app/auth/actions";

const CATEGORIES = [
  { href: "/the-loai/hanh-dong", label: "Hành Động" },
  { href: "/the-loai/phieu-luu", label: "Phiêu Lưu" },
  { href: "/the-loai/hoat-hinh", label: "Hoạt Hình" },
  { href: "/the-loai/phim-hai", label: "Hài" },
  { href: "/the-loai/hinh-su", label: "Hình Sự" },
  { href: "/the-loai/tai-lieu", label: "Tài Liệu" },
  { href: "/the-loai/chinh-kich", label: "Chính Kịch" },
  { href: "/the-loai/gia-dinh", label: "Gia Đình" },
  { href: "/the-loai/gia-tuong", label: "Giả Tưởng" },
  { href: "/the-loai/lich-su", label: "Lịch Sử" },
  { href: "/the-loai/kinh-di", label: "Kinh Dị" },
  { href: "/the-loai/phim-nhac", label: "Nhạc" },
  { href: "/the-loai/bi-an", label: "Bí Ẩn" },
  { href: "/the-loai/lang-man", label: "Lãng Mạn" },
  { href: "/the-loai/khoa-hoc-vien-tuong", label: "Khoa Học Viễn Tưởng" },
  { href: "/the-loai/gay-can", label: "Gây Cấn" },
  { href: "/the-loai/chien-tranh", label: "Chiến Tranh" },
  { href: "/the-loai/tam-ly", label: "Tâm Lý" },
  { href: "/the-loai/tinh-cam", label: "Tình Cảm" },
  { href: "/the-loai/co-trang", label: "Cổ Trang" },
  { href: "/the-loai/mien-tay", label: "Miền Tây" },
  { href: "/the-loai/phim-18", label: "Phim 18+" },
];

const COUNTRIES = [
  { href: "/quoc-gia/au-my", label: "Âu Mỹ" },
  { href: "/quoc-gia/anh", label: "Anh" },
  { href: "/quoc-gia/trung-quoc", label: "Trung Quốc" },
  { href: "/quoc-gia/indonesia", label: "Indonesia" },
  { href: "/quoc-gia/viet-nam", label: "Việt Nam" },
  { href: "/quoc-gia/phap", label: "Pháp" },
  { href: "/quoc-gia/hong-kong", label: "Hồng Kông" },
  { href: "/quoc-gia/han-quoc", label: "Hàn Quốc" },
  { href: "/quoc-gia/nhat-ban", label: "Nhật Bản" },
  { href: "/quoc-gia/thai-lan", label: "Thái Lan" },
  { href: "/quoc-gia/dai-loan", label: "Đài Loan" },
  { href: "/quoc-gia/nga", label: "Nga" },
  { href: "/quoc-gia/ha-lan", label: "Hà Lan" },
  { href: "/quoc-gia/philippines", label: "Philippines" },
  { href: "/quoc-gia/an-do", label: "Ấn Độ" },
  { href: "/quoc-gia/khac", label: "Quốc gia khác" },
];

const YEARS = Array.from({ length: 2026 - 2004 + 1 }, (_, i) => ({
  href: `/nam/${2004 + i}`,
  label: (2004 + i).toString(),
})).reverse();

const NAV_LINKS = [
  { href: "/danh-sach/tv-shows", label: "TV shows" },
  { href: "/danh-sach/phim-le", label: "Phim lẻ" },
  { href: "/danh-sach/phim-bo", label: "Phim bộ" },
  { href: "/danh-sach/phim-dang-chieu", label: "Phim đang chiếu" },
];

export default function Navbar({ user }: { user: User | null }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileCountryOpen, setMobileCountryOpen] = useState(false);
  const [mobileYearOpen, setMobileYearOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile menu on route change logic (Adjusting state during rendering)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setMobileCategoryOpen(false);
    setMobileCountryOpen(false);
    setMobileYearOpen(false);
  }

  // Scroll listener for navbar background
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/90 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/20"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-bold text-xl tracking-tight hover:text-amber-400 transition-colors"
          >
            <Popcorn className="w-6 h-6 text-amber-400" />
            <span className="font-display">
              XemPhim
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "text-amber-400 bg-amber-500/10"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Category Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
                Thể loại <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="w-[480px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-3 grid grid-cols-3 gap-1">
                  {CATEGORIES.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 text-sm text-zinc-300 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Country Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
                Quốc gia <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="w-[420px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-3 grid grid-cols-3 gap-1">
                  {COUNTRIES.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 text-sm text-zinc-300 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
                Năm <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full right-0 lg:left-auto pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="w-[320px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-3 grid grid-cols-4 gap-1">
                  {YEARS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 text-center text-sm text-zinc-300 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-amber-500/30 transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </button>

            {/* Auth Button / User Menu */}
            {user ? (
              <div className="relative group/user">
                <button className="flex items-center gap-2 p-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user.email?.[0] || "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 hidden sm:block transition-transform group-hover/user:rotate-180" />
                </button>
                
                {/* User Dropdown */}
                <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200">
                  <div className="w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs text-zinc-500 truncate">Đăng nhập với</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <UserIcon className="w-4 h-4 text-amber-500" />
                      Trang cá nhân
                    </Link>

                    <Link href="/yeu-thich" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <Heart className="w-4 h-4 text-rose-500" />
                      Phim yêu thích
                    </Link>
                    
                    <Link href="/lich-su" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <History className="w-4 h-4 text-blue-500" />
                      Lịch sử xem
                    </Link>
                    
                    <div className="h-px bg-white/5 my-1" />
                    
                    <form action={signOut}>
                      <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/5 bg-black/95 backdrop-blur-lg max-h-[85vh] overflow-y-auto">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-px bg-white/5 my-1" />

              {/* Category */}
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Thể loại
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCategoryOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileCategoryOpen && (
                  <div className="grid grid-cols-2 gap-1 px-2 py-2 bg-white/5 rounded-lg border border-white/5">
                    {CATEGORIES.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="px-3 py-2 text-sm text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setMobileCountryOpen(!mobileCountryOpen)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Quốc gia
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCountryOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileCountryOpen && (
                  <div className="grid grid-cols-2 gap-1 px-2 py-2 bg-white/5 rounded-lg border border-white/5">
                    {COUNTRIES.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="px-3 py-2 text-sm text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Year */}
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setMobileYearOpen(!mobileYearOpen)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Năm
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileYearOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileYearOpen && (
                  <div className="grid grid-cols-4 gap-1 px-2 py-2 bg-white/5 rounded-lg border border-white/5">
                    {YEARS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="px-3 py-2 text-center text-sm text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-px bg-white/5 my-1" />
              
              {user ? (
                <div className="flex flex-col gap-1 p-2 bg-white/5 rounded-xl border border-white/5">
                   <div className="px-3 py-2 mb-1">
                      <p className="text-xs text-zinc-500">Tài khoản</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg">
                      <UserIcon className="w-4 h-4 text-amber-500" />
                      Trang cá nhân
                    </Link>
                    <Link href="/yeu-thich" className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg">
                      <Heart className="w-4 h-4 text-rose-500" />
                      Phim yêu thích
                    </Link>
                    <Link href="/lich-su" className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg">
                      <History className="w-4 h-4 text-blue-500" />
                      Lịch sử xem
                    </Link>
                    <form action={signOut} className="mt-1">
                      <button type="submit" className="w-full flex items-center gap-3 px-3 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg">
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="mx-2 mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  Đăng nhập ngay
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
