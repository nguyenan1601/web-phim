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
  // Bổ sung dữ liệu category để trích xuất năm, thể loại chính xác hơn
  category?: Record<string, { 
    group: { id: string; name: string }; 
    list: { id: string; name: string }[] 
  }>;
}

/**
 * Trích xuất năm phát hành từ tên phim hoặc URL hình ảnh
 */
export function extractYearFromMovie(item: PhimItem): number {
  if (!item) return 0;

  // 1. Ưu tiên: Trích xuất từ dữ liệu 'category' chính thức (Nhóm 'Năm')
  if (item.category) {
    for (const key in item.category) {
      const group = item.category[key];
      if (group.group?.name?.toLowerCase().includes("năm")) {
        const yearStr = group.list?.[0]?.name;
        if (yearStr) {
          const year = parseInt(yearStr, 10);
          if (!isNaN(year)) return year;
        }
      }
    }
  }
  
  // 2. Fallback: Tìm năm trong ngoặc đơn (2024)
  const parenMatch = item.name.match(/\((\d{4})\)/) || item.original_name.match(/\((\d{4})\)/);
  if (parenMatch) return parseInt(parenMatch[1], 10);

  // 3. Fallback: Tìm năm trong URL hình ảnh (ví dụ: ...-2024-thumb.jpg)
  const urlMatch = item.thumb_url?.match(/[-_](\d{4})[-_]/) || item.poster_url?.match(/[-_](\d{4})[-_]/);
  if (urlMatch) return parseInt(urlMatch[1], 10);

  // 4. Fallback: Tìm năm 4 chữ số (19xx hoặc 20xx) trong tên
  const textMatch = item.name.match(/\b(19|20)\d{2}\b/) || item.original_name.match(/\b(19|20)\d{2}\b/);
  if (textMatch) return parseInt(textMatch[0], 10);

  return 0;
}

/**
 * Hàm so sánh phim: Mới cập nhật (modified) > Mới tạo (created) > Năm phát hành
 */
export function comparePhimItems(a: PhimItem, b: PhimItem): number {
  const modA = new Date(a.modified || 0).getTime();
  const modB = new Date(b.modified || 0).getTime();

  // 1. So sánh ngày cập nhật (modified) - Giảm dần
  if (modB !== modA) {
    return modB - modA;
  }

  // 2. Tiêu chuẩn thứ hai: Năm phát hành trích xuất được (Year) - Giảm dần
  const yearA = extractYearFromMovie(a);
  const yearB = extractYearFromMovie(b);
  if (yearB !== yearA) {
    return yearB - yearA;
  }

  // 3. Tiêu chí cuối cùng: Ngày tạo (created) - Giảm dần
  const creA = new Date(a.created || 0).getTime();
  const creB = new Date(b.created || 0).getTime();
  return creB - creA;
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
  category: Record<
    string,
    {
      group: { id: string; name: string };
      list: { id: string; name: string }[];
    }
  >;
  episodes: EpisodeServer[];
}

export interface FilmDetailResponse {
  status?: string;
  movie: MovieDetail;
}

export async function getPhimMoi(page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    console.error("Error fetching Phim Moi:", error);
    return null;
  }
}

export async function getPhimTheoDanhSach(
  slug: string,
  page: number = 1
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/danh-sach/${slug}?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching Danh Sach ${slug}:`, error);
    return null;
  }
}

export async function getPhimTheoTheLoai(
  slug: string,
  page: number = 1
): Promise<PhimResponse | null> {
  if (!slug) return null;
  try {
    const res = await fetch(`${API_BASE}/films/the-loai/${slug}?page=${page}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      console.warn(`Fetch failed for genre ${slug}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching The Loai ${slug}:`, error);
    return null;
  }
}

export async function getPhimTheoQuocGia(
  slug: string,
  page: number = 1
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/quoc-gia/${slug}?page=${page}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching Quoc Gia ${slug}:`, error);
    return null;
  }
}

export async function getPhimTheoNam(
  year: string,
  page: number = 1
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/nam-phat-hanh/${year}?page=${page}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching Nam ${year}:`, error);
    return null;
  }
}

interface GetPhimDetailOptions {
  silent?: boolean;
}

export async function getPhimDetail(
  slug: string,
  options: GetPhimDetailOptions = {}
): Promise<FilmDetailResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/film/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      if (!options.silent) {
        console.error(`Error fetching Detail ${slug}: ${res.status}`);
      }
      return null;
    }
    return await res.json();
  } catch (error) {
    if (!options.silent) {
      console.error(`Error fetching Detail ${slug}:`, error);
    }
    return null;
  }
}

export async function searchPhim(keyword: string): Promise<PhimResponse | null> {
  if (!keyword) return null;
  try {
    const res = await fetch(`${API_BASE}/films/search?keyword=${encodeURIComponent(keyword)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Error searching phim:", error);
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

export interface AdvancedFilterPageResult {
  items: PhimItem[];
  hasMore: boolean;
  totalItems?: number;
}

interface FilterSource {
  kind: "category" | "genre" | "country" | "year";
  slug: string;
  path: string;
}

interface FilterSourcePreview {
  source: FilterSource;
  items: PhimItem[];
  totalItems: number;
  totalPages: number;
}

function getCategoryPath(slug: string) {
  if (slug === "phim-moi" || slug === "phim-moi-cap-nhat") {
    return "/films/phim-moi-cap-nhat";
  }

  return `/films/danh-sach/${slug}`;
}

function normalizeFilterValue(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugifyFilterValue(value: string | null | undefined) {
  return normalizeFilterValue(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isCategoryResolvedByListSource(slug: string) {
  return ["phim-moi", "phim-moi-cap-nhat", "tv-shows", "subteam"].includes(slug);
}

function isSingleMovie(item: PhimItem) {
  const episodeStatus = normalizeFilterValue(item.current_episode);
  return item.total_episodes <= 1 || episodeStatus.includes("full");
}

function isCompletedSeries(item: PhimItem) {
  const episodeStatus = normalizeFilterValue(item.current_episode);
  return episodeStatus.includes("hoan tat") || episodeStatus.includes("tron bo");
}

function matchesCategoryFromItem(item: PhimItem, categorySlug: string) {
  const languageSlug = slugifyFilterValue(item.language);

  switch (categorySlug) {
    case "phim-le":
      return isSingleMovie(item);
    case "phim-bo":
      return !isSingleMovie(item);
    case "phim-tron-bo":
      return !isSingleMovie(item) && isCompletedSeries(item);
    case "phim-dang-chieu":
      return !isSingleMovie(item) && !isCompletedSeries(item);
    case "phim-vietsub":
      return languageSlug.includes("vietsub");
    case "phim-thuyet-minh":
      return languageSlug.includes("thuyet-minh");
    case "phim-long-tieng":
      return languageSlug.includes("long-tieng");
    default:
      return true;
  }
}

async function fetchFilmPage(path: string, page: number): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}${path}?page=${page}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) return null;

    return (await res.json()) as PhimResponse;
  } catch {
    return null;
  }
}

async function fetchSourcePreview(source: FilterSource): Promise<FilterSourcePreview | null> {
  const data = await fetchFilmPage(source.path, 1);
  if (!data) return null;

  return {
    source,
    items: data.items || [],
    totalItems: data.paginate?.total_items || 0,
    totalPages: data.paginate?.total_page || 1,
  };
}

async function fetchFilmsFromPreview(
  preview: FilterSourcePreview,
  maxPages: number
): Promise<PhimItem[]> {
  const movieMap = new Map<string, PhimItem>();

  for (const movie of preview.items) {
    if (!movieMap.has(movie.slug)) {
      movieMap.set(movie.slug, movie);
    }
  }

  const finalPage = Math.min(preview.totalPages, maxPages);
  const remainingPages = Array.from({ length: Math.max(finalPage - 1, 0) }, (_, index) => index + 2);
  const batchSize = 8;

  for (let index = 0; index < remainingPages.length; index += batchSize) {
    const pageBatch = remainingPages.slice(index, index + batchSize);
    const responses = await Promise.all(
      pageBatch.map((page) => fetchFilmPage(preview.source.path, page))
    );

    for (const data of responses) {
      if (!data) continue;

      for (const movie of data.items || []) {
        if (!movieMap.has(movie.slug)) {
          movieMap.set(movie.slug, movie);
        }
      }
    }
  }

  return Array.from(movieMap.values());
}

async function fetchUnionByGenres(genreSlugs: string[], maxPages: number): Promise<PhimItem[]> {
  const previews = await Promise.all(
    genreSlugs.map((slug) =>
      fetchSourcePreview({
        kind: "genre",
        slug,
        path: `/films/the-loai/${slug}`,
      })
    )
  );
  const movieMap = new Map<string, PhimItem>();

  for (const preview of previews) {
    if (!preview) continue;

    const items = await fetchFilmsFromPreview(preview, maxPages);
    for (const movie of items) {
      movieMap.set(movie.slug, movie);
    }
  }

  return Array.from(movieMap.values());
}

function getCategoryGroupSlugs(movie: MovieDetail, groupSlug: string) {
  return Object.values(movie.category || {})
    .filter((entry) => slugifyFilterValue(entry?.group?.name) === groupSlug)
    .flatMap((entry) =>
      Array.isArray(entry?.list)
        ? entry.list.map((item) => slugifyFilterValue(item?.name))
        : []
    )
    .filter(Boolean);
}

function matchesAdvancedDetailFilters(
  movieItem: PhimItem,
  movieDetail: MovieDetail,
  params: AdvancedFilterParams,
  selectedGenreSlugs: string[],
  selectedBase: FilterSource
) {
  if (
    params.categorySlug &&
    !(selectedBase.kind === "category" && selectedBase.slug === params.categorySlug)
  ) {
    if (!matchesCategoryFromItem(movieItem, params.categorySlug)) {
      return false;
    }
  }

  if (params.countrySlug) {
    const countrySlugs = getCategoryGroupSlugs(movieDetail, "quoc-gia");
    if (!countrySlugs.includes(params.countrySlug)) {
      return false;
    }
  }

  if (params.year) {
    const yearSlugs = getCategoryGroupSlugs(movieDetail, "nam");
    if (!yearSlugs.includes(params.year)) {
      return false;
    }
  }

  if (selectedGenreSlugs.length > 0) {
    const genreSlugs = getCategoryGroupSlugs(movieDetail, "the-loai");
    if (!selectedGenreSlugs.some((slug) => genreSlugs.includes(slug))) {
      return false;
    }
  }

  return true;
}

export async function getPhimByAdvancedFilters(
  params: AdvancedFilterParams
): Promise<PhimItem[]> {
  const normalizedGenreSlugs = Array.from(
    new Set((params.genreSlugs || []).map((item) => item.trim()).filter(Boolean))
  );
  const maxPages = params.maxPagesPerFilter
    ? Math.max(1, Math.min(params.maxPagesPerFilter, 5000))
    : Number.MAX_SAFE_INTEGER;

  const onlyGenresSelected =
    normalizedGenreSlugs.length > 0 &&
    !params.categorySlug &&
    !params.countrySlug &&
    !params.year;

  if (onlyGenresSelected) {
    const genreItems = await fetchUnionByGenres(normalizedGenreSlugs, maxPages);
    return genreItems.sort(comparePhimItems);
  }

  const candidateSources: FilterSource[] = [];

  if (params.categorySlug) {
    candidateSources.push({
      kind: "category",
      slug: params.categorySlug,
      path: getCategoryPath(params.categorySlug),
    });
  }

  if (params.countrySlug) {
    candidateSources.push({
      kind: "country",
      slug: params.countrySlug,
      path: `/films/quoc-gia/${params.countrySlug}`,
    });
  }

  if (params.year) {
    candidateSources.push({
      kind: "year",
      slug: params.year,
      path: `/films/nam-phat-hanh/${params.year}`,
    });
  }

  if (normalizedGenreSlugs.length === 1) {
    candidateSources.push({
      kind: "genre",
      slug: normalizedGenreSlugs[0],
      path: `/films/the-loai/${normalizedGenreSlugs[0]}`,
    });
  }

  if (candidateSources.length === 0) {
    return [];
  }

  const previews = (await Promise.all(candidateSources.map(fetchSourcePreview))).filter(
    (preview): preview is FilterSourcePreview => Boolean(preview)
  );

  if (previews.length === 0) {
    return [];
  }

  const forcedCategoryPreview =
    params.categorySlug && isCategoryResolvedByListSource(params.categorySlug)
      ? previews.find(
          (preview) =>
            preview.source.kind === "category" && preview.source.slug === params.categorySlug
        )
      : null;

  const basePreview =
    forcedCategoryPreview ||
    previews.reduce((smallest, current) =>
      current.totalItems < smallest.totalItems ? current : smallest
    );

  let baseMovies = await fetchFilmsFromPreview(basePreview, maxPages);

  const needsCategoryCheck =
    Boolean(params.categorySlug) &&
    !(basePreview.source.kind === "category" && basePreview.source.slug === params.categorySlug);

  if (needsCategoryCheck && params.categorySlug) {
    baseMovies = baseMovies.filter((movie) => matchesCategoryFromItem(movie, params.categorySlug!));
  }

  const needsCountryCheck =
    Boolean(params.countrySlug) &&
    !(basePreview.source.kind === "country" && basePreview.source.slug === params.countrySlug);
  const needsYearCheck =
    Boolean(params.year) &&
    !(basePreview.source.kind === "year" && basePreview.source.slug === params.year);
  const needsGenreCheck =
    normalizedGenreSlugs.length > 0 &&
    !(
      basePreview.source.kind === "genre" &&
      normalizedGenreSlugs.length === 1 &&
      basePreview.source.slug === normalizedGenreSlugs[0]
    );

  if (!needsCategoryCheck && !needsCountryCheck && !needsYearCheck && !needsGenreCheck) {
    return baseMovies.sort(comparePhimItems);
  }

  const filteredMovies: PhimItem[] = [];

  for (let index = 0; index < baseMovies.length; index += 10) {
    const batch = baseMovies.slice(index, index + 10);
    const batchResults = await Promise.all(
      batch.map(async (movie) => {
        const detailResponse = await getPhimDetail(movie.slug, { silent: true });
        if (!detailResponse?.movie) {
          return null;
        }

        return matchesAdvancedDetailFilters(
          movie,
          detailResponse.movie,
          params,
          normalizedGenreSlugs,
          basePreview.source
        )
          ? movie
          : null;
      })
    );

    filteredMovies.push(
      ...batchResults.filter((movie): movie is PhimItem => Boolean(movie))
    );
  }

  return filteredMovies.sort(comparePhimItems);
}

export async function getPhimByAdvancedFiltersPage(
  params: AdvancedFilterParams,
  page: number,
  pageSize: number
): Promise<AdvancedFilterPageResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const startIndex = (safePage - 1) * safePageSize;
  const endIndexExclusive = startIndex + safePageSize;

  const normalizedGenreSlugs = Array.from(
    new Set((params.genreSlugs || []).map((item) => item.trim()).filter(Boolean))
  );
  const maxPages = params.maxPagesPerFilter
    ? Math.max(1, Math.min(params.maxPagesPerFilter, 5000))
    : Number.MAX_SAFE_INTEGER;

  const onlyGenresSelected =
    normalizedGenreSlugs.length > 0 &&
    !params.categorySlug &&
    !params.countrySlug &&
    !params.year;

  if (onlyGenresSelected) {
    const allItems = await getPhimByAdvancedFilters(params);
    return {
      items: allItems.slice(startIndex, endIndexExclusive),
      hasMore: allItems.length > endIndexExclusive,
      totalItems: allItems.length,
    };
  }

  const candidateSources: FilterSource[] = [];

  if (params.categorySlug) {
    candidateSources.push({
      kind: "category",
      slug: params.categorySlug,
      path: getCategoryPath(params.categorySlug),
    });
  }

  if (params.countrySlug) {
    candidateSources.push({
      kind: "country",
      slug: params.countrySlug,
      path: `/films/quoc-gia/${params.countrySlug}`,
    });
  }

  if (params.year) {
    candidateSources.push({
      kind: "year",
      slug: params.year,
      path: `/films/nam-phat-hanh/${params.year}`,
    });
  }

  if (normalizedGenreSlugs.length === 1) {
    candidateSources.push({
      kind: "genre",
      slug: normalizedGenreSlugs[0],
      path: `/films/the-loai/${normalizedGenreSlugs[0]}`,
    });
  }

  if (candidateSources.length === 0) {
    return { items: [], hasMore: false };
  }

  const previews = (await Promise.all(candidateSources.map(fetchSourcePreview))).filter(
    (preview): preview is FilterSourcePreview => Boolean(preview)
  );

  if (previews.length === 0) {
    return { items: [], hasMore: false };
  }

  const forcedCategoryPreview =
    params.categorySlug && isCategoryResolvedByListSource(params.categorySlug)
      ? previews.find(
          (preview) =>
            preview.source.kind === "category" && preview.source.slug === params.categorySlug
        )
      : null;

  const basePreview =
    forcedCategoryPreview ||
    previews.reduce((smallest, current) =>
      current.totalItems < smallest.totalItems ? current : smallest
    );

  const needsCategoryCheck =
    Boolean(params.categorySlug) &&
    !(basePreview.source.kind === "category" && basePreview.source.slug === params.categorySlug);

  const needsCountryCheck =
    Boolean(params.countrySlug) &&
    !(basePreview.source.kind === "country" && basePreview.source.slug === params.countrySlug);
    
  const needsYearCheck =
    Boolean(params.year) &&
    !(basePreview.source.kind === "year" && basePreview.source.slug === params.year);
    
  const needsGenreCheck =
    normalizedGenreSlugs.length > 0 &&
    !(
      basePreview.source.kind === "genre" &&
      normalizedGenreSlugs.length === 1 &&
      basePreview.source.slug === normalizedGenreSlugs[0]
    );

  const needsDetailCheck = needsCountryCheck || needsGenreCheck;

  // Trả về ngay nếu không cần kiểm tra thêm điều kiện nào
  if (!needsCategoryCheck && !needsCountryCheck && !needsYearCheck && !needsGenreCheck) {
    let baseMovies = await fetchFilmsFromPreview(basePreview, maxPages);
    baseMovies = baseMovies.sort(comparePhimItems);
    return {
      items: baseMovies.slice(startIndex, endIndexExclusive),
      hasMore: baseMovies.length > endIndexExclusive,
      totalItems: basePreview.totalItems,
    };
  }

  // Thuật toán: Lazy / Chunked Fetching để tăng tốc tối đa
  // Thay vì tải toàn bộ phim và gọi Detail, chúng ta duyệt API gốc theo từng cụm (chunk)
  const matchedMovies: PhimItem[] = [];
  let currentUpstreamPage = 1;
  const CHUNK_SIZE = 4; // Tải 4 trang API (~40 phim) mỗi lần quét
  let hitLimit = false;

  while (matchedMovies.length < endIndexExclusive && currentUpstreamPage <= maxPages && currentUpstreamPage <= basePreview.totalPages) {
    // 1. Tải danh sách phim cơ bản theo cụm
    const pagesToFetch = [];
    for (let i = 0; i < CHUNK_SIZE && currentUpstreamPage <= basePreview.totalPages && currentUpstreamPage <= maxPages; i++, currentUpstreamPage++) {
      pagesToFetch.push(currentUpstreamPage);
    }
    
    if (pagesToFetch.length === 0) break;

    const pagesData = await Promise.all(
      pagesToFetch.map(p => p === 1 ? { items: basePreview.items } : fetchFilmPage(basePreview.source.path, p))
    );

    // 2. Lọc sơ bộ (Pre-filter) bằng dữ liệu cơ bản để tránh gọi API Detail không cần thiết
    let candidates: PhimItem[] = [];
    for (const data of pagesData) {
      if (!data || !data.items) continue;
      
      const filtered = data.items.filter(movie => {
        if (needsCategoryCheck && params.categorySlug && !matchesCategoryFromItem(movie, params.categorySlug)) return false;
        
        if (needsYearCheck && params.year) {
          const year = extractYearFromMovie(movie);
          if (year !== 0 && year.toString() !== params.year) return false;
        }
        return true;
      });
      candidates.push(...filtered);
    }

    if (candidates.length === 0) continue;

    // 3. Nếu không cần kiểm tra Detail (chỉ lọc Category và Update Year), lưu kết quả ngay
    if (!needsDetailCheck) {
      matchedMovies.push(...candidates);
      continue;
    }

    // 4. Gọi API Detail song song cho các candidate còn lại để kiểm tra Thể loại / Quốc gia
    const batchDetails = await Promise.all(
      candidates.map(async (movie) => {
        try {
          const detailResponse = await getPhimDetail(movie.slug, { silent: true });
          if (!detailResponse?.movie) return null;

          if (matchesAdvancedDetailFilters(movie, detailResponse.movie, params, normalizedGenreSlugs, basePreview.source)) {
            return { ...movie, category: detailResponse.movie.category };
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    for (const m of batchDetails) {
      if (m) matchedMovies.push(m);
    }
  }

  // Cập nhật lại sắp xếp (API gốc đã sắp xếp hờ theo ngày cập nhật, nhưng cần sort lại chính xác)
  const finalSortedMovies = matchedMovies.sort(comparePhimItems);

  return {
    items: finalSortedMovies.slice(startIndex, endIndexExclusive),
    hasMore: finalSortedMovies.length > endIndexExclusive || (currentUpstreamPage <= basePreview.totalPages && currentUpstreamPage <= maxPages),
    totalItems: basePreview.totalItems,
  };
}
