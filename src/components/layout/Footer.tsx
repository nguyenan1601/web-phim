import Link from "next/link";
import { Popcorn } from "lucide-react";

const GENRES = [
  { slug: "hanh-dong", name: "Hành Động" },
  { slug: "tinh-cam", name: "Tình Cảm" },
  { slug: "phim-hai", name: "Hài Hước" },
  { slug: "kinh-di", name: "Kinh Dị" },
  { slug: "co-trang", name: "Cổ Trang" },
  { slug: "hoat-hinh", name: "Hoạt Hình" },
  { slug: "khoa-hoc-vien-tuong", name: "Viễn Tưởng" },
  { slug: "tam-ly", name: "Tâm Lý" },
];

const COUNTRIES = [
  { slug: "han-quoc", name: "Hàn Quốc" },
  { slug: "trung-quoc", name: "Trung Quốc" },
  { slug: "au-my", name: "Âu Mỹ" },
  { slug: "nhat-ban", name: "Nhật Bản" },
  { slug: "thai-lan", name: "Thái Lan" },
  { slug: "viet-nam", name: "Việt Nam" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Popcorn className="w-5 h-5 text-amber-400" />
              <span className="font-display"><span className="font-bold">XemPhim</span></span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Kho phim khổng lồ miễn phí. Cập nhật phim mới mỗi ngày với chất lượng cao nhất.
            </p>
          </div>

          {/* Danh Mục */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Danh Mục</h3>
            <ul className="space-y-2">
              <li><Link href="/danh-sach/phim-moi" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">Phim Mới</Link></li>
              <li><Link href="/danh-sach/phim-bo" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">Phim Bộ</Link></li>
              <li><Link href="/danh-sach/phim-le" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">Phim Lẻ</Link></li>
              <li><Link href="/the-loai/hoat-hinh" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">Hoạt Hình</Link></li>
            </ul>
          </div>

          {/* Thể Loại */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Thể Loại</h3>
            <ul className="space-y-2">
              {GENRES.slice(0, 6).map((g) => (
                <li key={g.slug}>
                  <Link href={`/the-loai/${g.slug}`} className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quốc Gia */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Quốc Gia</h3>
            <ul className="space-y-2">
              {COUNTRIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/quoc-gia/${c.slug}`} className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            © 2026 XemPhim. Dữ liệu cung cấp bởi phim.nguonc.com.
          </p>
          <p className="text-xs text-zinc-700">
            Dự án phi lợi nhuận · Không kinh doanh
          </p>
        </div>
      </div>
    </footer>
  );
}
