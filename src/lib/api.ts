import { providerRegistry } from "./providers/registry";

const API_BASE = "https://phimapi.com";
const DEFAULT_IMAGE_BASE = "https://phimimg.com";
const API_HEADERS = {
  accept: "application/json",
};

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
  category?: Record<string, { 
    group: { id: string; name: string }; 
    list: { id: string; name: string }[] 
  }>;
}

export function extractYearFromMovie(item: PhimItem): number {
  if (!item) return 0;

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

  const parenMatch = item.name.match(/\((\d{4})\)/) || item.original_name.match(/\((\d{4})\)/);
  if (parenMatch) return parseInt(parenMatch[1], 10);

  const urlMatch = item.thumb_url?.match(/[-_](\d{4})[-_]/) || item.poster_url?.match(/[-_](\d{4})[-_]/);
  if (urlMatch) return parseInt(urlMatch[1], 10);

  const textMatch = item.name.match(/\b(19|20)\d{2}\b/) || item.original_name.match(/\b(19|20)\d{2}\b/);
  if (textMatch) return parseInt(textMatch[0], 10);

  return 0;
}

export function comparePhimItems(a: PhimItem, b: PhimItem): number {
  const modA = new Date(a.modified || 0).getTime();
  const modB = new Date(b.modified || 0).getTime();

  if (modB !== modA) {
    return modB - modA;
  }

  const yearA = extractYearFromMovie(a);
  const yearB = extractYearFromMovie(b);
  if (yearB !== yearA) {
    return yearB - yearA;
  }

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

// ============ New API raw interfaces ============

interface PhimApiNamedItem {
  id?: string;
  name?: string;
  slug?: string;
}

interface PhimApiTimeObject {
  time?: string;
}

interface PhimApiMovieItem {
  _id?: string;
  name?: string;
  slug?: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  created?: PhimApiTimeObject | string;
  modified?: PhimApiTimeObject | string;
  content?: string;
  type?: string;
  status?: string;
  episode_current?: unknown;
  episode_total?: unknown;
  time?: string;
  quality?: string;
  lang?: string;
  year?: number | string;
  actor?: string[];
  director?: string[];
  category?: PhimApiNamedItem[];
  country?: PhimApiNamedItem[];
  episodes?: PhimApiEpisodeServer[];
  trailer_url?: string;
  is_copyright?: boolean;
  sub_docquyen?: boolean;
  chieurap?: boolean;
}

interface PhimApiEpisodeItem {
  name?: string;
  slug?: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
}

interface PhimApiEpisodeServer {
  server_name?: string;
  server_data?: PhimApiEpisodeItem[];
}

// V1 flat list response
interface PhimApiListResponseV1 {
  status?: boolean | string;
  msg?: string;
  items?: PhimApiMovieItem[];
  pagination?: {
    totalItems?: number;
    totalItemsPerPage?: number;
    currentPage?: number;
    totalPages?: number;
  };
}

// V2/V3 rich response
interface PhimApiListResponseV2 {
  status?: boolean | string;
  msg?: string;
  data?: {
    items?: PhimApiMovieItem[];
    params?: {
      type_slug?: string;
      filterCategory?: string[];
      filterCountry?: string[];
      filterYear?: string[];
      filterType?: string[];
      sortField?: string;
      sortType?: string;
      pagination?: {
        totalItems?: number;
        totalItemsPerPage?: number;
        currentPage?: number;
        totalPages?: number;
      };
    };
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

interface PhimApiDetailResponse {
  status?: boolean | string;
  msg?: string;
  movie?: PhimApiMovieItem;
  episodes?: PhimApiEpisodeServer[];
}

// ============ Normalization functions ============

function getTimeValue(value: PhimApiMovieItem["created"] | PhimApiMovieItem["modified"]) {
  if (!value) return "";
  return typeof value === "string" ? value : value.time || "";
}

function normalizeImageUrl(value: string | undefined, imageBase = DEFAULT_IMAGE_BASE) {
  if (!value) return "";

  let fullUrl: string;

  if (/^https?:\/\//i.test(value)) {
    fullUrl = value;
  } else {
    const cleanValue = value.replace(/^\/+/, "");
    const cleanBase = imageBase.replace(/\/+$/, "");

    if (cleanValue.startsWith("uploads/")) {
      fullUrl = `${cleanBase}/${cleanValue}`;
    } else {
      fullUrl = `${cleanBase}/uploads/movies/${cleanValue}`;
    }
  }

  // Convert to WEBP via phimapi.com image proxy
  return `https://phimapi.com/image.php?url=${encodeURIComponent(fullUrl)}`;
}

function normalizeNamedItems(items: PhimApiNamedItem[] | undefined) {
  return (items || []).map((item) => ({
    id: item.slug || item.id || "",
    name: item.name || "",
  }));
}

function buildCategoryRecord(item: PhimApiMovieItem): MovieDetail["category"] {
  const record: MovieDetail["category"] = {};
  const genres = normalizeNamedItems(item.category);
  const countries = normalizeNamedItems(item.country);
  const year = item.year ? String(item.year) : "";

  if (genres.length > 0) {
    record["the-loai"] = {
      group: { id: "the-loai", name: "Thể loại" },
      list: genres,
    };
  }

  if (countries.length > 0) {
    record["quoc-gia"] = {
      group: { id: "quoc-gia", name: "Quốc gia" },
      list: countries,
    };
  }

  if (year) {
    record.nam = {
      group: { id: "nam", name: "Năm" },
      list: [{ id: year, name: year }],
    };
  }

  return record;
}

function parseEpisodeTotal(item: PhimApiMovieItem) {
  if (item.type === "single" || item.type === "movie") return 1;

  const source = normalizeEpisodeText(item.episode_total || item.episode_current);
  if (/full/i.test(source)) return 1;

  const match = source.match(/\d+/);
  return match ? Number(match[0]) : 2;
}

function normalizeEpisodeText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeMovieItem(
  item: PhimApiMovieItem,
  imageBase?: string
): PhimItem {
  return {
    name: item.name || "",
    slug: item.slug || "",
    original_name: (item.origin_name || "").replace(/&#039;/g, "'"),
    thumb_url: normalizeImageUrl(item.thumb_url, imageBase),
    poster_url: normalizeImageUrl(item.poster_url || item.thumb_url, imageBase),
    created: getTimeValue(item.created),
    modified: getTimeValue(item.modified),
    description: item.content || "",
    total_episodes: parseEpisodeTotal(item),
    current_episode: normalizeEpisodeText(item.episode_current),
    time: item.time || "",
    quality: item.quality || "",
    language: item.lang || "",
    director: (item.director || []).filter(Boolean).join(", "),
    casts: (item.actor || []).filter(Boolean).join(", ") || null,
    category: buildCategoryRecord(item),
  };
}

function normalizeEpisodeServers(episodes: PhimApiEpisodeServer[] | undefined) {
  return (episodes || [])
    .map((server) => ({
      server_name: server.server_name || "Server",
      items: (server.server_data || [])
        .map((episode, index) => ({
          name: episode.name || String(index + 1),
          slug: episode.slug || `tap-${index + 1}`,
          embed: episode.link_embed || "",
          m3u8: episode.link_m3u8 || "",
        }))
        .filter((episode) => episode.embed || episode.m3u8),
    }))
    .filter((server) => server.items.length > 0);
}

// ============ API fetch functions ============

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

export async function getAllCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/the-loai`, {
      headers: API_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json)) return json as CategoryItem[];
    if (json.data && Array.isArray(json.data)) return json.data as CategoryItem[];
    return [];
  } catch {
    return [];
  }
}

export async function getPhimMoi(
  page: number = 1,
  options: { silent?: boolean } = {}
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
      headers: API_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      if (!options.silent) {
        console.warn(`Error fetching Phim Moi page ${page}: ${res.status}`);
      }
      return null;
    }
    const json = await res.json() as PhimApiListResponseV1;

    const items = (json.items || []);
    const pagination = json.pagination || {};
    const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
    const totalItems = pagination.totalItems || items.length;

    const data: PhimResponse = {
      status: String(json.status || "success"),
      paginate: {
        current_page: pagination.currentPage || 1,
        total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        total_items: totalItems,
        items_per_page: itemsPerPage,
      },
      items: items.map((item) => normalizeMovieItem(item)),
    };

    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    if (!options.silent) {
      console.warn("Error fetching Phim Moi:", error);
    }
    return null;
  }
}

export async function getPhimTheoDanhSach(
  slug: string,
  page: number = 1
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/api/danh-sach/${slug}?page=${page}`, {
      headers: API_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json() as PhimApiListResponseV2;

    const dataObj = json.data || {};
    const items = (dataObj.items || []);
    const pagination = dataObj.params?.pagination || {};
    const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
    const totalItems = pagination.totalItems || items.length;
    const imageBase = dataObj.APP_DOMAIN_CDN_IMAGE;

    const data: PhimResponse = {
      status: String(json.status || "success"),
      paginate: {
        current_page: pagination.currentPage || 1,
        total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        total_items: totalItems,
        items_per_page: itemsPerPage,
      },
      items: items.map((item) => normalizeMovieItem(item, imageBase)),
    };

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
    const res = await fetch(`${API_BASE}/v1/api/the-loai/${slug}?page=${page}`, {
      headers: API_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      console.warn(`Fetch failed for genre ${slug}: ${res.status}`);
      return null;
    }
    const json = await res.json() as PhimApiListResponseV2;

    const dataObj = json.data || {};
    const items = (dataObj.items || []);
    const pagination = dataObj.params?.pagination || {};
    const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
    const totalItems = pagination.totalItems || items.length;
    const imageBase = dataObj.APP_DOMAIN_CDN_IMAGE;

    const data: PhimResponse = {
      status: String(json.status || "success"),
      paginate: {
        current_page: pagination.currentPage || 1,
        total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        total_items: totalItems,
        items_per_page: itemsPerPage,
      },
      items: items.map((item) => normalizeMovieItem(item, imageBase)),
    };

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
  page: number = 1,
  options: { silent?: boolean } = {}
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/api/quoc-gia/${slug}?page=${page}`, {
      headers: API_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      if (!options.silent) {
        console.warn(`Error fetching Quoc Gia ${slug} page ${page}: ${res.status}`);
      }
      return null;
    }
    const json = await res.json() as PhimApiListResponseV2;

    const dataObj = json.data || {};
    const items = (dataObj.items || []);
    const pagination = dataObj.params?.pagination || {};
    const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
    const totalItems = pagination.totalItems || items.length;
    const imageBase = dataObj.APP_DOMAIN_CDN_IMAGE;

    const data: PhimResponse = {
      status: String(json.status || "success"),
      paginate: {
        current_page: pagination.currentPage || 1,
        total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        total_items: totalItems,
        items_per_page: itemsPerPage,
      },
      items: items.map((item) => normalizeMovieItem(item, imageBase)),
    };

    if (data && data.items) {
      data.items.sort(comparePhimItems);
    }
    return data;
  } catch (error) {
    if (!options.silent) {
      console.warn(`Error fetching Quoc Gia ${slug}:`, error);
    }
    return null;
  }
}

export async function getPhimTheoNam(
  year: string,
  page: number = 1
): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/api/nam/${year}?page=${page}`, {
      headers: API_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json() as PhimApiListResponseV2;

    const dataObj = json.data || {};
    const items = (dataObj.items || []);
    const pagination = dataObj.params?.pagination || {};
    const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
    const totalItems = pagination.totalItems || items.length;
    const imageBase = dataObj.APP_DOMAIN_CDN_IMAGE;

    const data: PhimResponse = {
      status: String(json.status || "success"),
      paginate: {
        current_page: pagination.currentPage || 1,
        total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        total_items: totalItems,
        items_per_page: itemsPerPage,
      },
      items: items.map((item) => normalizeMovieItem(item, imageBase)),
    };

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
    const res = await fetch(`${API_BASE}/phim/${slug}`, {
      headers: API_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      if (!options.silent) {
        console.error(`Error fetching Detail ${slug}: ${res.status}`);
      }
      return null;
    }
    const json = await res.json() as PhimApiDetailResponse;
    const movie = json.movie;
    if (!movie) return null;

    const normalizedMovie = normalizeMovieItem(movie);
    const episodes = json.episodes || movie.episodes;

    return {
      status: String(json.status || "success"),
      movie: {
        ...normalizedMovie,
        id: movie._id || movie.slug || "",
        category: buildCategoryRecord(movie),
        episodes: normalizeEpisodeServers(episodes),
      },
    };
  } catch (error) {
    if (!options.silent) {
      console.error(`Error fetching Detail ${slug}:`, error);
    }
    return null;
  }
}

/**
 * getPhimDetailMerged
 *
 * Lấy chi tiết phim từ provider chính (kkphim → fallback) rồi merge thêm
 * episodes từ tất cả episode providers (nguonc, ...).
 * Dùng function này thay cho getPhimDetail khi muốn xem được nhiều server.
 */
export async function getPhimDetailMerged(
  slug: string,
  options?: { silent?: boolean; preferredProvider?: string }
): Promise<FilmDetailResponse | null> {
  const result = await providerRegistry.getDetailWithMergedServers(slug, options);
  if (!result) return null;

  // Convert về FilmDetailResponse (bỏ source field)
  // cast an toàn vì movie từ provider luôn có category đầy đủ
  return {
    status: result.status,
    movie: result.movie as FilmDetailResponse["movie"],
  };
}

/**
 * Lấy danh sách episode providers đã đăng ký (dùng cho UI chọn nguồn)
 */
export function getEpisodeProviderList() {
  return providerRegistry.getEpisodeProviderDetails();
}

export interface SearchPhimOptions {
  page?: number;
  limit?: number;
}

export async function searchPhim(
  keyword: string,
  options: SearchPhimOptions = {},
): Promise<PhimResponse | null> {
  if (!keyword) return null;
  const { page = 1, limit } = options;

  try {
    const params = new URLSearchParams();
    params.set("keyword", keyword);
    if (page > 1) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));

    const res = await fetch(`${API_BASE}/v1/api/tim-kiem?${params.toString()}`, {
      headers: API_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json() as PhimApiListResponseV2;

    const dataObj = json.data || {};
    const items = (dataObj.items || []);
    const pagination = dataObj.params?.pagination || {};
    const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
    const totalItems = pagination.totalItems || items.length;
    const imageBase = dataObj.APP_DOMAIN_CDN_IMAGE;

    return {
      status: String(json.status || "success"),
      paginate: {
        current_page: pagination.currentPage || 1,
        total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        total_items: totalItems,
        items_per_page: itemsPerPage,
      },
      items: items.map((item) => normalizeMovieItem(item, imageBase)),
    };
  } catch (error) {
    console.error("Error searching phim:", error);
    return null;
  }
}

// ============ Advanced Filter (unchanged logic, uses updated fetchers) ============

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
    return "/danh-sach/phim-moi-cap-nhat";
  }

  return `/v1/api/danh-sach/${slug}`;
}

function normalizeFilterValue(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
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
    const fullPath = path.startsWith("/danh-sach/")
      ? `${API_BASE}${path}?page=${page}`
      : `${API_BASE}${path}?page=${page}`;

    const res = await fetch(fullPath, {
      headers: API_HEADERS,
      next: { revalidate: 1800 },
    });

    if (!res.ok) return null;
    const json = await res.json();

    // Handle both V1 and V2 response formats
    if (json.items && Array.isArray(json.items)) {
      // V1 format
      const v1 = json as PhimApiListResponseV1;
      const items = (v1.items || []);
      const pagination = v1.pagination || {};
      const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
      const totalItems = pagination.totalItems || items.length;

      return {
        status: String(v1.status || "success"),
        paginate: {
          current_page: pagination.currentPage || 1,
          total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          total_items: totalItems,
          items_per_page: itemsPerPage,
        },
        items: items.map((item) => normalizeMovieItem(item)),
      };
    } else if (json.data) {
      // V2 format
      const v2 = json as PhimApiListResponseV2;
      const dataObj = v2.data || {};
      const items = (dataObj.items || []);
      const pagination = dataObj.params?.pagination || {};
      const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
      const totalItems = pagination.totalItems || items.length;
      const imageBase = dataObj.APP_DOMAIN_CDN_IMAGE;

      return {
        status: String(v2.status || "success"),
        paginate: {
          current_page: pagination.currentPage || 1,
          total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          total_items: totalItems,
          items_per_page: itemsPerPage,
        },
        items: items.map((item) => normalizeMovieItem(item, imageBase)),
      };
    }

    return null;
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
        path: `/v1/api/the-loai/${slug}`,
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
    .filter((entry) => (entry?.group?.id || slugifyFilterValue(entry?.group?.name)) === groupSlug)
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
      path: `/v1/api/quoc-gia/${params.countrySlug}`,
    });
  }

  if (params.year) {
    candidateSources.push({
      kind: "year",
      slug: params.year,
      path: `/v1/api/nam/${params.year}`,
    });
  }

  if (normalizedGenreSlugs.length === 1) {
    candidateSources.push({
      kind: "genre",
      slug: normalizedGenreSlugs[0],
      path: `/v1/api/the-loai/${normalizedGenreSlugs[0]}`,
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
      path: `/v1/api/quoc-gia/${params.countrySlug}`,
    });
  }

  if (params.year) {
    candidateSources.push({
      kind: "year",
      slug: params.year,
      path: `/v1/api/nam/${params.year}`,
    });
  }

  if (normalizedGenreSlugs.length === 1) {
    candidateSources.push({
      kind: "genre",
      slug: normalizedGenreSlugs[0],
      path: `/v1/api/the-loai/${normalizedGenreSlugs[0]}`,
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

  if (!needsCategoryCheck && !needsCountryCheck && !needsYearCheck && !needsGenreCheck) {
    let baseMovies = await fetchFilmsFromPreview(basePreview, maxPages);
    baseMovies = baseMovies.sort(comparePhimItems);
    return {
      items: baseMovies.slice(startIndex, endIndexExclusive),
      hasMore: baseMovies.length > endIndexExclusive,
      totalItems: basePreview.totalItems,
    };
  }

  const matchedMoviesMap = new Map<string, PhimItem>();
  let currentUpstreamPage = 1;
  const CHUNK_SIZE = 4;

  while (
    matchedMoviesMap.size < endIndexExclusive &&
    currentUpstreamPage <= maxPages &&
    currentUpstreamPage <= basePreview.totalPages
  ) {
    const pagesToFetch = [];
    for (
      let i = 0;
      i < CHUNK_SIZE &&
      currentUpstreamPage <= basePreview.totalPages &&
      currentUpstreamPage <= maxPages;
      i++, currentUpstreamPage++
    ) {
      pagesToFetch.push(currentUpstreamPage);
    }

    if (pagesToFetch.length === 0) break;

    const pagesData = await Promise.all(
      pagesToFetch.map((p) =>
        p === 1 ? { items: basePreview.items } : fetchFilmPage(basePreview.source.path, p)
      )
    );

    const candidates: PhimItem[] = [];
    for (const data of pagesData) {
      if (!data?.items) continue;

      for (const movie of data.items) {
        if (matchedMoviesMap.has(movie.slug)) continue;

        if (
          needsCategoryCheck &&
          params.categorySlug &&
          !matchesCategoryFromItem(movie, params.categorySlug)
        ) {
          continue;
        }

        if (needsYearCheck && params.year) {
          const year = extractYearFromMovie(movie);
          if (year !== 0 && year.toString() !== params.year) continue;
        }

        candidates.push(movie);
      }
    }

    if (candidates.length === 0) continue;

    if (!needsDetailCheck) {
      for (const cand of candidates) {
        if (!matchedMoviesMap.has(cand.slug)) {
          matchedMoviesMap.set(cand.slug, cand);
        }
      }
      continue;
    }

    const batchDetails = await Promise.all(
      candidates.map(async (movie) => {
        try {
          const detailResponse = await getPhimDetail(movie.slug, { silent: true });
          if (!detailResponse?.movie) return null;

          if (
            matchesAdvancedDetailFilters(
              movie,
              detailResponse.movie,
              params,
              normalizedGenreSlugs,
              basePreview.source
            )
          ) {
            return { ...movie, category: detailResponse.movie.category };
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    for (const m of batchDetails) {
      if (m && !matchedMoviesMap.has(m.slug)) {
        matchedMoviesMap.set(m.slug, m);
      }
    }
  }

  const allMatched = Array.from(matchedMoviesMap.values());
  const finalSortedMovies = allMatched.sort(comparePhimItems);
  
  const isReliableCount = !needsCategoryCheck && !needsCountryCheck && !needsYearCheck && !needsGenreCheck;

  return {
    items: finalSortedMovies.slice(startIndex, endIndexExclusive),
    hasMore:
      finalSortedMovies.length > endIndexExclusive ||
      (currentUpstreamPage <= basePreview.totalPages && currentUpstreamPage <= maxPages),
    totalItems: isReliableCount ? basePreview.totalItems : undefined,
  };
}

// ──────────────────────────────────────────
// Multi-Provider Adapter Functions
// Dùng ProviderRegistry để fallback qua nhiều nguồn
// Giữ backward compatibility hoàn toàn
// ──────────────────────────────────────────

/**
 * Lấy chi tiết phim từ provider đầu tiên tìm thấy (fallback).
 * Giống getPhimDetail nhưng tự động thử nhiều providers.
 *
 * @deprecated Không deprecate - dùng song song với getPhimDetail cũ,
 *             ưu tiên xài hàm này cho mới khi cần fallback
 */
export async function getPhimDetailWithFallback(
  slug: string,
  options?: { silent?: boolean; preferredProvider?: string }
) {
  return providerRegistry.getDetailFallback(slug, {
    silent: options?.silent,
    preferredProvider: options?.preferredProvider,
  });
}

/**
 * Lấy chi tiết phim từ TẤT CẢ providers.
 * Trả về mảng các kết quả, mỗi kết quả gắn source.
 * Dùng để UI hiển thị multi-source cho người dùng chọn.
 */
export async function getPhimDetailFromAll(slug: string, options?: { silent?: boolean }) {
  return providerRegistry.getDetailFromAll(slug, options);
}

/** Lấy danh sách providers đã đăng ký */
export function getRegisteredProviders() {
  return providerRegistry.getDetails();
}
