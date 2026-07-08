import type {
  IMovieProvider,
  FilmDetailResult,
  PhimResponse,
  EpisodeItem,
  EpisodeServer,
  PhimItem,
} from "./types";

const API_BASE = "https://phimapi.com";
const DEFAULT_IMAGE_BASE = "https://phimimg.com";
const API_HEADERS = {
  accept: "application/json",
};

interface PhimApiMovieItem {
  _id?: string;
  name?: string;
  slug?: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  created?: string | { time?: string };
  modified?: string | { time?: string };
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
  category?: { id?: string; name?: string; slug?: string }[];
  country?: { id?: string; name?: string; slug?: string }[];
  episodes?: PhimApiEpisodeServer[];
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

interface PhimApiDetailResponse {
  status?: boolean | string;
  msg?: string;
  movie?: PhimApiMovieItem;
  episodes?: PhimApiEpisodeServer[];
}

function getTimeValue(value: PhimApiMovieItem["created"] | PhimApiMovieItem["modified"]) {
  if (!value) return "";
  return typeof value === "string" ? value : (value as { time?: string }).time || "";
}

function normalizeImageUrl(value: string | undefined) {
  if (!value) return "";
  let fullUrl: string;
  if (/^https?:\/\//i.test(value)) {
    fullUrl = value;
  } else {
    const cleanValue = value.replace(/^\/+/, "");
    const cleanBase = DEFAULT_IMAGE_BASE.replace(/\/+$/, "");
    if (cleanValue.startsWith("uploads/")) {
      fullUrl = `${cleanBase}/${cleanValue}`;
    } else {
      fullUrl = `${cleanBase}/uploads/movies/${cleanValue}`;
    }
  }
  return `https://phimapi.com/image.php?url=${encodeURIComponent(fullUrl)}`;
}

function normalizeNamedItems(items: { id?: string; name?: string; slug?: string }[] | undefined) {
  return (items || []).map((item) => ({
    id: item.slug || item.id || "",
    name: item.name || "",
  }));
}

function buildCategoryRecord(item: PhimApiMovieItem) {
  const record: Record<string, { group: { id: string; name: string }; list: { id: string; name: string }[] }> = {};
  const genres = normalizeNamedItems(item.category);
  const countries = normalizeNamedItems(item.country);
  const year = item.year ? String(item.year) : "";
  if (genres.length > 0) {
    record["the-loai"] = { group: { id: "the-loai", name: "Thể loại" }, list: genres };
  }
  if (countries.length > 0) {
    record["quoc-gia"] = { group: { id: "quoc-gia", name: "Quốc gia" }, list: countries };
  }
  if (year) {
    record.nam = { group: { id: "nam", name: "Năm" }, list: [{ id: year, name: year }] };
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

function normalizeMovieItem(item: PhimApiMovieItem): PhimItem {
  return {
    name: item.name || "",
    slug: item.slug || "",
    original_name: (item.origin_name || "").replace(/&#039;/g, "'"),
    thumb_url: normalizeImageUrl(item.thumb_url),
    poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
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
        .filter((ep: EpisodeItem) => ep.embed || ep.m3u8),
    }))
    .filter((server: EpisodeServer) => server.items.length > 0);
}

export class KkphimProvider implements IMovieProvider {
  readonly name = "kkphim";
  readonly label = "KKPhim";
  readonly priority = 1; // default provider, highest priority

  async getDetail(slug: string, options?: { silent?: boolean }): Promise<FilmDetailResult | null> {
    try {
      const res = await fetch(`${API_BASE}/phim/${slug}`, {
        headers: API_HEADERS,
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        if (!options?.silent) console.error(`[KKPhim] Detail ${slug}: ${res.status}`);
        return null;
      }
      const json = (await res.json()) as PhimApiDetailResponse;
      const movie = json.movie;
      if (!movie) return null;

      const normalizedMovie = normalizeMovieItem(movie);
      const episodes = json.episodes || movie.episodes;

      return {
        status: String(json.status || "success"),
        source: this.name,
        movie: {
          ...normalizedMovie,
          id: movie._id || movie.slug || "",
          category: buildCategoryRecord(movie),
          episodes: normalizeEpisodeServers(episodes),
        },
      };
    } catch (error) {
      if (!options?.silent) console.error(`[KKPhim] Detail ${slug}:`, error);
      return null;
    }
  }

  async getPhimMoi(page: number = 1): Promise<PhimResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
        headers: API_HEADERS,
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      const json = await res.json() as {
        status?: boolean | string;
        items?: PhimApiMovieItem[];
        pagination?: {
          totalItems?: number;
          totalItemsPerPage?: number;
          currentPage?: number;
          totalPages?: number;
        };
      };

      const items = (json.items || []).map(normalizeMovieItem);
      const pagination = json.pagination || {};
      const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
      const totalItems = pagination.totalItems || items.length;

      return {
        status: String(json.status || "success"),
        paginate: {
          current_page: pagination.currentPage || 1,
          total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          total_items: totalItems,
          items_per_page: itemsPerPage,
        },
        items,
      };
    } catch (error) {
      console.error("[KKPhim] getPhimMoi:", error);
      return null;
    }
  }

  async search(keyword: string, options?: { page?: number; limit?: number }): Promise<PhimResponse | null> {
    if (!keyword) return null;
    const { page = 1, limit } = options || {};
    try {
      const params = new URLSearchParams({ keyword });
      if (page > 1) params.set("page", String(page));
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`${API_BASE}/v1/api/tim-kiem?${params.toString()}`, {
        headers: API_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = await res.json() as {
        status?: boolean | string;
        data?: {
          items?: PhimApiMovieItem[];
          params?: {
            pagination?: {
              totalItems?: number;
              totalItemsPerPage?: number;
              currentPage?: number;
              totalPages?: number;
            };
          };
          APP_DOMAIN_CDN_IMAGE?: string;
        };
      };

      const dataObj = json.data || {};
      const items = (dataObj.items || []).map(normalizeMovieItem);
      const pagination = dataObj.params?.pagination || {};
      const itemsPerPage = pagination.totalItemsPerPage || items.length || 24;
      const totalItems = pagination.totalItems || items.length;

      return {
        status: String(json.status || "success"),
        paginate: {
          current_page: pagination.currentPage || 1,
          total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          total_items: totalItems,
          items_per_page: itemsPerPage,
        },
        items,
      };
    } catch (error) {
      console.error("[KKPhim] search:", error);
      return null;
    }
  }
}

/** Singleton instance */
export const kkphimProvider = new KkphimProvider();
