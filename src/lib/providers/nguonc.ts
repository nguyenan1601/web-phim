import type {
  IMovieProvider,
  IEpisodeProvider,
  EpisodeServer,
  EpisodeItem,
  FilmDetailResult,
  MovieDetail,
  PhimItem,
  PhimResponse,
} from "./types";

/**
 * NguoncEpisodeProvider
 *
 * Chỉ cung cấp episodes/servers bổ sung từ nguonc API.
 * Movie info (name, thumb, ...) vẫn lấy từ kkphim.
 *
 * Cấu trúc API dự kiến:
 *   GET /api/phim/{slug} → { movie: {...}, episodes: [{ server_name, server_data: [...] }] }
 *
 * Nếu API không reachable, getServers trả null → im lặng fallback.
 */
const DEFAULT_API_BASE = "https://phim.nguonc.com/api";
const API_BASE = (process.env.NGUONC_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
const API_PROXY_URL = process.env.NGUONC_API_PROXY_URL;
const API_HEADERS = {
  accept: "application/json",
};

interface NguoncEpisodeItem {
  name?: string;
  slug?: string;
  filename?: string;
  embed?: string;
  m3u8?: string;
  link_embed?: string;
  link_m3u8?: string;
}

interface NguoncEpisodeServer {
  server_name?: string;
  items?: NguoncEpisodeItem[];
  server_data?: NguoncEpisodeItem[];
}

type NguoncCategoryRecord = MovieDetail["category"];

interface NguoncMovieItem {
  id?: string | number;
  _id?: string | number;
  name?: string;
  slug?: string;
  original_name?: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  created?: string;
  modified?: string;
  description?: string;
  content?: string;
  total_episodes?: number | string;
  current_episode?: string | number;
  episode_current?: string | number;
  time?: string;
  quality?: string;
  language?: string;
  lang?: string;
  director?: string | string[] | null;
  casts?: string | string[] | null;
  actor?: string | string[] | null;
  category?: NguoncCategoryRecord;
  episodes?: NguoncEpisodeServer[];
}

interface NguoncDetailResponse {
  status?: boolean | string;
  msg?: string;
  movie?: NguoncMovieItem;
  episodes?: NguoncEpisodeServer[];
}

interface NguoncSearchItem {
  name?: string;
  slug?: string;
  original_name?: string;
}

interface NguoncSearchResponse {
  status?: boolean | string;
  items?: NguoncSearchItem[];
}

interface NguoncListResponse {
  status?: boolean | string;
  paginate?: {
    current_page?: number;
    total_page?: number;
    total_items?: number;
    items_per_page?: number;
  };
  items?: NguoncMovieItem[];
}

function normalizePeople(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value || "";
}

function normalizeEpisodeText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function parseEpisodeTotal(value: unknown) {
  if (typeof value === "number") return value;

  const source = normalizeEpisodeText(value);
  if (/full/i.test(source)) return 1;

  const match = source.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function normalizeEpisodeName(name: string | undefined, index: number) {
  const value = (name || String(index + 1)).trim();
  return /^\d+$/.test(value) ? `Tập ${value}` : value;
}

function normalizeServers(episodes: NguoncEpisodeServer[] | undefined): EpisodeServer[] {
  if (!episodes || !Array.isArray(episodes)) return [];

  return episodes
    .map((server) => {
      const items = server.server_data || server.items || [];

      return {
        server_name: server.server_name || "NguonC",
        items: items
          .map((ep, index): EpisodeItem => ({
            name: normalizeEpisodeName(ep.name, index),
            slug: ep.slug || `tap-${index + 1}`,
            embed: ep.link_embed || ep.embed || "",
            m3u8: ep.link_m3u8 || ep.m3u8 || "",
          }))
          .filter((ep) => ep.embed || ep.m3u8),
      };
    })
    .filter((server) => server.items.length > 0);
}

function normalizeMovieItem(item: NguoncMovieItem): PhimItem {
  return {
    name: item.name || "",
    slug: item.slug || "",
    original_name: item.original_name || item.origin_name || "",
    thumb_url: item.thumb_url || item.poster_url || "",
    poster_url: item.poster_url || item.thumb_url || "",
    created: item.created || "",
    modified: item.modified || "",
    description: item.description || item.content || "",
    total_episodes: parseEpisodeTotal(item.total_episodes),
    current_episode: normalizeEpisodeText(item.current_episode || item.episode_current),
    time: item.time || "",
    quality: item.quality || "",
    language: item.language || item.lang || "",
    director: normalizePeople(item.director),
    casts: normalizePeople(item.casts || item.actor) || null,
    category: item.category || {},
  };
}

function normalizeMovieDetail(
  item: NguoncMovieItem,
  episodes?: NguoncEpisodeServer[]
): MovieDetail {
  return {
    ...normalizeMovieItem(item),
    id: String(item.id || item._id || item.slug || ""),
    category: item.category || {},
    episodes: normalizeServers(episodes || item.episodes),
  };
}

function normalizeListResponse(json: NguoncListResponse): PhimResponse | null {
  const items = json.items || [];
  if (!Array.isArray(items)) return null;

  const pagination = json.paginate || {};
  const itemsPerPage = pagination.items_per_page || items.length || 10;
  const totalItems = pagination.total_items || items.length;

  return {
    status: String(json.status || "success"),
    paginate: {
      current_page: pagination.current_page || 1,
      total_page: pagination.total_page || Math.max(1, Math.ceil(totalItems / itemsPerPage)),
      total_items: totalItems,
      items_per_page: itemsPerPage,
    },
    items: items.map(normalizeMovieItem),
  };
}

function normalizeSearchText(value: string | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getEpisodes(json: NguoncDetailResponse) {
  return (
    json.episodes ||
    ((json.movie as { episodes?: NguoncEpisodeServer[] } | undefined)?.episodes)
  );
}

function buildApiUrl(path: string, params?: URLSearchParams) {
  const upstreamUrl = `${API_BASE}${path}${params ? `?${params.toString()}` : ""}`;
  if (!API_PROXY_URL) return upstreamUrl;

  const proxyUrl = new URL(API_PROXY_URL);
  proxyUrl.searchParams.set("url", upstreamUrl);
  return proxyUrl.toString();
}

async function fetchDetail(slug: string) {
  const res = await fetch(buildApiUrl(`/film/${slug}`), {
    headers: API_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  return (await res.json()) as NguoncDetailResponse;
}

async function fetchList(path: string, page: number) {
  const res = await fetch(buildApiUrl(path, new URLSearchParams({ page: String(page) })), {
    headers: API_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  return normalizeListResponse((await res.json()) as NguoncListResponse);
}

async function resolveSlugBySearch(keywords: string[]) {
  const targets = keywords.map(normalizeSearchText).filter(Boolean);
  if (targets.length === 0) return null;

  for (const keyword of keywords) {
    if (!keyword) continue;

    const params = new URLSearchParams({ keyword });
    const res = await fetch(buildApiUrl("/films/search", params), {
      headers: API_HEADERS,
      next: { revalidate: 3600 },
    });

    if (!res.ok) continue;

    const json = (await res.json()) as NguoncSearchResponse;
    const items = json.items || [];
    const exact = items.find((item) => {
      const name = normalizeSearchText(item.name);
      const originalName = normalizeSearchText(item.original_name);
      return targets.includes(name) || targets.includes(originalName);
    });

    if (exact?.slug) return exact.slug;
    if (items[0]?.slug) return items[0].slug;
  }

  return null;
}

export class NguoncEpisodeProvider implements IMovieProvider, IEpisodeProvider {
  readonly name = "nguonc";
  readonly label = "NguonC";
  readonly priority = 1;

  async getDetail(slug: string, options?: { silent?: boolean }): Promise<FilmDetailResult | null> {
    if (!slug) return null;

    try {
      const json = await fetchDetail(slug);
      if (!json?.movie) {
        if (!options?.silent) {
          console.warn(`[NguonC] Detail ${slug}: no movie found`);
        }
        return null;
      }

      return {
        status: String(json.status || "success"),
        source: this.name,
        movie: normalizeMovieDetail(json.movie, getEpisodes(json)),
      };
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] Detail ${slug}:`, error);
      }
      return null;
    }
  }

  async getPhimMoi(
    page: number = 1,
    options?: { silent?: boolean }
  ): Promise<PhimResponse | null> {
    try {
      return await fetchList("/films/phim-moi-cap-nhat", page);
    } catch (error) {
      if (!options?.silent) {
        console.error("[NguonC] getPhimMoi:", error);
      }
      return null;
    }
  }

  async getDanhSach(
    slug: string,
    page: number = 1,
    options?: { silent?: boolean }
  ): Promise<PhimResponse | null> {
    if (!slug) return null;

    try {
      return await fetchList(`/films/danh-sach/${slug}`, page);
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] getDanhSach ${slug}:`, error);
      }
      return null;
    }
  }

  async getTheLoai(
    slug: string,
    page: number = 1,
    options?: { silent?: boolean }
  ): Promise<PhimResponse | null> {
    if (!slug) return null;

    try {
      return await fetchList(`/films/the-loai/${slug}`, page);
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] getTheLoai ${slug}:`, error);
      }
      return null;
    }
  }

  async getQuocGia(
    slug: string,
    page: number = 1,
    options?: { silent?: boolean }
  ): Promise<PhimResponse | null> {
    if (!slug) return null;

    try {
      return await fetchList(`/films/quoc-gia/${slug}`, page);
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] getQuocGia ${slug}:`, error);
      }
      return null;
    }
  }

  async getNam(
    year: string,
    page: number = 1,
    options?: { silent?: boolean }
  ): Promise<PhimResponse | null> {
    if (!year) return null;

    try {
      return await fetchList(`/films/nam-phat-hanh/${year}`, page);
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] getNam ${year}:`, error);
      }
      return null;
    }
  }

  async getByLegacyPath(
    path: string,
    page: number = 1,
    options?: { silent?: boolean }
  ): Promise<PhimResponse | null> {
    try {
      const listPath = this.resolveLegacyPath(path);
      return listPath ? await fetchList(listPath, page) : null;
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] getByLegacyPath ${path}:`, error);
      }
      return null;
    }
  }

  async search(
    keyword: string,
    options?: { page?: number; limit?: number; silent?: boolean }
  ): Promise<PhimResponse | null> {
    if (!keyword) return null;

    try {
      const params = new URLSearchParams({ keyword });
      if (options?.page && options.page > 1) params.set("page", String(options.page));

      const res = await fetch(buildApiUrl("/films/search", params), {
        headers: API_HEADERS,
        cache: "no-store",
      });

      if (!res.ok) return null;
      return normalizeListResponse((await res.json()) as NguoncListResponse);
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] search ${keyword}:`, error);
      }
      return null;
    }
  }

  private resolveLegacyPath(path: string) {
    if (path === "/danh-sach/phim-moi-cap-nhat" || path === "/films/phim-moi-cap-nhat") {
      return "/films/phim-moi-cap-nhat";
    }

    const listMatch = path.match(/^\/(?:v1\/api\/)?danh-sach\/([^/?]+)$/);
    if (listMatch) return `/films/danh-sach/${listMatch[1]}`;

    const genreMatch = path.match(/^\/(?:v1\/api\/)?the-loai\/([^/?]+)$/);
    if (genreMatch) return `/films/the-loai/${genreMatch[1]}`;

    const countryMatch = path.match(/^\/(?:v1\/api\/)?quoc-gia\/([^/?]+)$/);
    if (countryMatch) return `/films/quoc-gia/${countryMatch[1]}`;

    const yearMatch = path.match(/^\/(?:v1\/api\/)?nam\/([^/?]+)$/);
    if (yearMatch) return `/films/nam-phat-hanh/${yearMatch[1]}`;

    return null;
  }

  async getServers(
    slug: string,
    options?: { silent?: boolean; movieName?: string; originalName?: string }
  ): Promise<EpisodeServer[] | null> {
    if (!slug) return null;

    try {
      let json = await fetchDetail(slug);
      let episodes = json ? getEpisodes(json) : undefined;

      if (!episodes || episodes.length === 0) {
        const resolvedSlug = await resolveSlugBySearch([
          options?.movieName || "",
          options?.originalName || "",
          slug,
        ]);

        if (resolvedSlug && resolvedSlug !== slug) {
          json = await fetchDetail(resolvedSlug);
          episodes = json ? getEpisodes(json) : undefined;
        }
      }

      if (!episodes || episodes.length === 0) {
        if (!options?.silent) {
          console.warn(`[NguonC] getServers ${slug}: no episodes found`);
        }
        return null;
      }

      const servers = normalizeServers(episodes);
      if (servers.length === 0) return null;

      return servers;
    } catch (error) {
      if (!options?.silent) {
        console.error(`[NguonC] getServers ${slug}:`, error);
      }
      return null;
    }
  }
}

/** Singleton instance */
export const nguoncProvider = new NguoncEpisodeProvider();
