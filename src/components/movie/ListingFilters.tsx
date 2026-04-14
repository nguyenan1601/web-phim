"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Filter, Search } from "lucide-react";

interface ListingFiltersProps {
  currentCategory?: string;
  currentGenres?: string[];
  currentCountry?: string;
  currentYear?: string;
}

const CATEGORY_OPTIONS = [
  { slug: "", label: "Danh sách phim" },
  { slug: "phim-moi", label: "Phim mới cập nhật" },
  { slug: "phim-le", label: "Phim lẻ" },
  { slug: "phim-bo", label: "Phim bộ" },
  { slug: "phim-dang-chieu", label: "Phim đang chiếu" },
  { slug: "phim-tron-bo", label: "Phim trọn bộ" },
  { slug: "tv-shows", label: "TV Shows" },
];

const GENRE_OPTIONS = [
  { slug: "hanh-dong", label: "Hành động" },
  { slug: "phieu-luu", label: "Phiêu lưu" },
  { slug: "hoat-hinh", label: "Hoạt hình" },
  { slug: "phim-hai", label: "Hài" },
  { slug: "hinh-su", label: "Hình sự" },
  { slug: "tai-lieu", label: "Tài liệu" },
  { slug: "chinh-kich", label: "Chính kịch" },
  { slug: "gia-dinh", label: "Gia đình" },
  { slug: "gia-tuong", label: "Giả tưởng" },
  { slug: "lich-su", label: "Lịch sử" },
  { slug: "kinh-di", label: "Kinh dị" },
  { slug: "phim-nhac", label: "Nhạc" },
  { slug: "bi-an", label: "Bí ẩn" },
  { slug: "lang-man", label: "Lãng mạn" },
  { slug: "khoa-hoc-vien-tuong", label: "Khoa học viễn tưởng" },
  { slug: "gay-can", label: "Gay cấn" },
  { slug: "chien-tranh", label: "Chiến tranh" },
  { slug: "tam-ly", label: "Tâm lý" },
  { slug: "tinh-cam", label: "Tình cảm" },
  { slug: "co-trang", label: "Cổ trang" },
  { slug: "mien-tay", label: "Miền Tây" },
  { slug: "phim-18", label: "Phim 18+" },
];

const COUNTRY_OPTIONS = [
  { slug: "", label: "Quốc gia" },
  { slug: "au-my", label: "Âu Mỹ" },
  { slug: "anh", label: "Anh" },
  { slug: "trung-quoc", label: "Trung Quốc" },
  { slug: "indonesia", label: "Indonesia" },
  { slug: "viet-nam", label: "Việt Nam" },
  { slug: "phap", label: "Pháp" },
  { slug: "hong-kong", label: "Hồng Kông" },
  { slug: "han-quoc", label: "Hàn Quốc" },
  { slug: "nhat-ban", label: "Nhật Bản" },
  { slug: "thai-lan", label: "Thái Lan" },
  { slug: "dai-loan", label: "Đài Loan" },
  { slug: "nga", label: "Nga" },
  { slug: "ha-lan", label: "Hà Lan" },
  { slug: "philippines", label: "Philippines" },
  { slug: "an-do", label: "Ấn Độ" },
  { slug: "khac", label: "Quốc gia khác" },
];

const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_SUGGESTED_YEAR = 2000;
const YEAR_OPTIONS = [
  ...Array.from({ length: CURRENT_YEAR - EARLIEST_SUGGESTED_YEAR + 1 }, (_, index) => {
    const year = CURRENT_YEAR - index;
    return { slug: year.toString(), label: year.toString() };
  }),
];

export default function ListingFilters({
  currentCategory = "",
  currentGenres = [],
  currentCountry = "",
  currentYear = "",
}: ListingFiltersProps) {
  const router = useRouter();
  const [category, setCategory] = useState(currentCategory);
  const [country, setCountry] = useState(currentCountry);
  const [year, setYear] = useState(currentYear);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [genres, setGenres] = useState<string[]>(() =>
    Array.from(new Set(currentGenres)).filter(Boolean)
  );
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  const hasAnyFilter = Boolean(category || country || year || genres.length > 0);

  const genreLabelMap = useMemo(() => {
    return new Map(GENRE_OPTIONS.map((option) => [option.slug, option.label]));
  }, []);

  const genreDropdownLabel =
    genres.length === 1
      ? genreLabelMap.get(genres[0]) || "Thể loại"
      : genres.length > 1
        ? "Tùy chọn"
        : "Thể loại";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenreDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleGenre = (slug: string) => {
    setGenres((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((item) => item !== slug);
      }
      return [...prev, slug];
    });
  };

  const handleFilterSearch = () => {
    if (!hasAnyFilter) return;

    const normalizedYear = year.trim();
    const params = new URLSearchParams();

    if (category) params.set("danh-sach", category);
    if (genres.length > 0) params.set("the-loai", genres.join(","));
    if (country) params.set("quoc-gia", country);
    if (normalizedYear) params.set("nam", normalizedYear);

    router.push(`/loc?${params.toString()}`);
  };

  const resetAllFilters = () => {
    setCategory("");
    setCountry("");
    setYear("");
    setGenres([]);
    router.push("/loc");
  };

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="mb-4 flex items-center gap-2 text-amber-400">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Bộ lọc nhanh</span>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Danh sách phim
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.label} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Thể loại
          </span>
          <div ref={genreDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsGenreDropdownOpen((value) => !value)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
            >
              <span className="truncate text-left">{genreDropdownLabel}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                  isGenreDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isGenreDropdownOpen ? (
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl shadow-black/40">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Chọn nhiều thể loại
                  </span>
                  <span className="text-xs text-zinc-500">Đã chọn {genres.length}</span>
                </div>

                <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {GENRE_OPTIONS.map((option) => {
                    const isActive = genres.includes(option.slug);

                    return (
                      <button
                        key={option.slug}
                        type="button"
                        onClick={() => toggleGenre(option.slug)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                          isActive
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                            : "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            isActive
                              ? "border-amber-400 bg-amber-500 text-black"
                              : "border-zinc-600 bg-transparent"
                          }`}
                        >
                          {isActive ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setGenres([])}
                    className="text-xs text-zinc-400 transition hover:text-amber-300"
                  >
                    Xóa thể loại
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGenreDropdownOpen(false)}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
                  >
                    Xong
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </label>

        <label>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Quốc gia
          </span>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.label} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Năm
          </span>
          <input
            list="filter-year-options"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Khác (vui lòng nhập năm)"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
          />
          <datalist id="filter-year-options">
            <option value="">Năm</option>
            {YEAR_OPTIONS.map((option) => (
              <option key={option.label} value={option.slug}>
                {option.label}
              </option>
            ))}
            <option value="">Vui lòng nhập năm</option>
          </datalist>
        </label>
      </div>

      {genres.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {genres.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => toggleGenre(slug)}
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300 transition hover:bg-amber-500/20"
            >
              {genreLabelMap.get(slug) || slug} x
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleFilterSearch}
          disabled={!hasAnyFilter}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
        >
          <Search className="h-4 w-4" />
          Tìm kiếm bộ lọc
        </button>

        <button
          type="button"
          onClick={resetAllFilters}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-amber-500/30 hover:text-amber-300"
        >
          Đặt lại bộ lọc
        </button>
      </div>
    </section>
  );
}
