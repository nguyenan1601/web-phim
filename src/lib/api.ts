const API_BASE = "https://phim.nguonc.com/api";

export interface PhimItem {
  name: string;
  slug: string;
  original_name: string;
  thumb_url: string;
  poster_url: string;
  created: string;
  modified: string;
  description: string;
  total_episodes: number;
  current_episode: string;
  time: string;
  quality: string;
  language: string;
  director: string;
  casts: string | null;
}

export interface PhimResponse {
  status: string;
  paginate: {
    current_page: number;
    total_page: number;
    total_items: number;
    items_per_page: number;
  };
  items: PhimItem[];
}

export interface EpisodeItem {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}

export interface EpisodeServer {
  server_name: string;
  items: EpisodeItem[];
}

export interface MovieDetail extends PhimItem {
  id: string;
  category: Record<string, { group: { id: string; name: string }; list: { id: string; name: string }[] }>;
  episodes: EpisodeServer[];
}

export interface FilmDetailResponse {
  status?: string;
  movie: MovieDetail;
}

/**
 * Lấy danh sách phim mới cập nhật
 */
export async function getPhimMoi(page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 3600 } // Tự động cache 1 giờ ở Vercel Edge 
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Error fetching Phim Moi:", error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo danh mục (SLUG)
 */
export async function getPhimTheoDanhSach(slug: string, page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/danh-sach/${slug}?page=${page}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Danh Sach ${slug}:`, error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo thể loại
 */
export async function getPhimTheoTheLoai(slug: string, page: number = 1): Promise<PhimResponse | null> {
  if (!slug) return null;
  try {
    const res = await fetch(`${API_BASE}/films/the-loai/${slug}?page=${page}`, {
      next: { revalidate: 86400 } // Danh sách theo thể loại lưu kho 24h
    });
    if (!res.ok) {
      console.warn(`Fetch failed for genre ${slug}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching The Loai ${slug}:`, error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo quốc gia
 */
export async function getPhimTheoQuocGia(slug: string, page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/quoc-gia/${slug}?page=${page}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Quoc Gia ${slug}:`, error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo năm phát hành
 */
export async function getPhimTheoNam(year: string, page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/nam-phat-hanh/${year}?page=${page}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Nam ${year}:`, error);
    return null;
  }
}

/**
 * Lấy chi tiết thông tin phim & danh sách tập video
 */
export async function getPhimDetail(slug: string): Promise<FilmDetailResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/film/${slug}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Detail ${slug}:`, error);
    return null;
  }
}

/**
 * Tìm kiếm phim bằng từ khóa
 */
export async function searchPhim(keyword: string): Promise<PhimResponse | null> {
  if (!keyword) return null;
  try {
    // Tìm kiếm không nên Cache
    const res = await fetch(`${API_BASE}/films/search?keyword=${encodeURIComponent(keyword)}`, {
      cache: "no-store" 
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error searching phim:`, error);
    return null;
  }
}

export interface AdvancedFilterParams {
  categorySlug?: string;
  genreSlugs?: string[];
  countrySlug?: string;
  year?: string;
  maxPagesPerFilter?: number;
}

function getCategoryPath(slug: string) {
  if (slug === "phim-moi" || slug === "phim-moi-cap-nhat") {
    return "/films/phim-moi-cap-nhat";
  }

  return `/films/danh-sach/${slug}`;
}

async function fetchFilmsByPath(path: string, maxPages: number): Promise<PhimItem[]> {
  const movieMap = new Map<string, PhimItem>();
  let totalPages = 1;

  for (let page = 1; page <= totalPages && page <= maxPages; page += 1) {
    try {
      const res = await fetch(`${API_BASE}${path}?page=${page}`, {
        next: { revalidate: 1800 },
      });

      if (!res.ok) break;

      const data = (await res.json()) as PhimResponse;
      totalPages = data.paginate?.total_page || 1;

      for (const movie of data.items || []) {
        if (!movieMap.has(movie.slug)) {
          movieMap.set(movie.slug, movie);
        }
      }
    } catch {
      break;
    }
  }

  return Array.from(movieMap.values());
}

export async function getPhimByAdvancedFilters(
  params: AdvancedFilterParams
): Promise<PhimItem[]> {
  const maxPages = Math.max(1, Math.min(params.maxPagesPerFilter || 8, 20));
  const datasets: PhimItem[][] = [];

  if (params.categorySlug) {
    datasets.push(await fetchFilmsByPath(getCategoryPath(params.categorySlug), maxPages));
  }

  const normalizedGenreSlugs = Array.from(
    new Set((params.genreSlugs || []).map((item) => item.trim()).filter(Boolean))
  );

  if (normalizedGenreSlugs.length > 0) {
    const genreDatasets = await Promise.all(
      normalizedGenreSlugs.map((slug) => fetchFilmsByPath(`/films/the-loai/${slug}`, maxPages))
    );
    const genreUnionMap = new Map<string, PhimItem>();
    for (const genreItems of genreDatasets) {
      for (const movie of genreItems) {
        genreUnionMap.set(movie.slug, movie);
      }
    }
    datasets.push(Array.from(genreUnionMap.values()));
  }

  if (params.countrySlug) {
    datasets.push(await fetchFilmsByPath(`/films/quoc-gia/${params.countrySlug}`, maxPages));
  }

  if (params.year) {
    datasets.push(await fetchFilmsByPath(`/films/nam-phat-hanh/${params.year}`, maxPages));
  }

  if (datasets.length === 0) return [];

  if (datasets.some((items) => items.length === 0)) return [];

  const [firstSet, ...restSets] = datasets.map(
    (items) => new Set(items.map((movie) => movie.slug))
  );

  const slugIntersection = Array.from(firstSet).filter((slug) =>
    restSets.every((set) => set.has(slug))
  );

  const mergedMap = new Map<string, PhimItem>();
  for (const dataset of datasets) {
    for (const movie of dataset) {
      if (!mergedMap.has(movie.slug)) {
        mergedMap.set(movie.slug, movie);
      }
    }
  }

  const mergedItems = slugIntersection
    .map((slug) => mergedMap.get(slug))
    .filter((movie): movie is PhimItem => Boolean(movie))
    .sort(
      (a, b) =>
        new Date(b.modified || b.created || 0).getTime() -
        new Date(a.modified || a.created || 0).getTime()
    );

  return mergedItems;
}
