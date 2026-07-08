import type {
  IMovieProvider,
  FilmDetailResult,
  PhimResponse,
  EpisodeServer,
  EpisodeItem,
  PhimItem,
} from "./types";

const API_BASE = "https://phimmoi.com/api/v1"; // ví dụ
const API_HEADERS = {
  accept: "application/json",
};

/**
 * PhimMoiProvider - provider mẫu chứng minh kiến trúc multi-provider
 *
 * NOTE: API endpoint này chỉ là ví dụ. Bạn cần thay URL thật.
 * Nếu API không hoạt động, provider sẽ im lặng fallback sang provider khác.
 */
interface PhimMoiListItem {
  name?: string;
  slug?: string;
  origin_name?: string;
  original_name?: string;
  thumb_url?: string;
  poster?: string;
  poster_url?: string;
  created?: string;
  modified?: string;
  content?: string;
  description?: string;
  total_episodes?: number;
  episode_total?: number;
  current_episode?: string;
  episode_current?: string;
  time?: string;
  duration?: string;
  quality?: string;
  language?: string;
  lang?: string;
  director?: string;
  casts?: string | null;
  actor?: string | null;
}

export class PhimMoiProvider implements IMovieProvider {
  readonly name = "phimmoi";
  readonly label = "PhimMoi";
  readonly priority = 2; // thấp hơn kkphim, chỉ dùng khi kkphim fail

  async getDetail(slug: string, options?: { silent?: boolean }): Promise<FilmDetailResult | null> {
    try {
      const res = await fetch(`${API_BASE}/film/${slug}`, {
        headers: API_HEADERS,
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        if (!options?.silent) console.warn(`[PhimMoi] Detail ${slug}: ${res.status}`);
        return null;
      }
      const json = await res.json();
      const movie = json.movie || json.data?.movie;
      if (!movie) return null;

      // Normalize: đây là giả định cấu trúc response - cần điều chỉnh theo API thật
      const episodes: EpisodeServer[] = (movie.episodes || []).map(
        (server: { server_name?: string; items?: { name?: string; slug?: string; embed?: string; m3u8?: string }[] }) => ({
          server_name: server.server_name || "Server",
          items: (server.items || []).map(
            (ep): EpisodeItem => ({
              name: ep.name || "",
              slug: ep.slug || "",
              embed: ep.embed || "",
              m3u8: ep.m3u8 || "",
            })
          ),
        })
      ).filter((s: EpisodeServer) => s.items.length > 0);

      return {
        status: "success",
        source: this.name,
        movie: {
          id: movie._id || movie.id || slug,
          name: movie.name || "",
          slug: movie.slug || slug,
          original_name: movie.origin_name || movie.original_name || "",
          thumb_url: movie.thumb_url || movie.poster || "",
          poster_url: movie.poster_url || movie.poster || movie.thumb_url || "",
          created: movie.created || "",
          modified: movie.modified || "",
          description: movie.content || movie.description || "",
          total_episodes: movie.total_episodes || movie.episode_total || 0,
          current_episode: movie.current_episode || movie.episode_current || "",
          time: movie.time || movie.duration || "",
          quality: movie.quality || "",
          language: movie.language || movie.lang || "",
          director: movie.director || "",
          casts: movie.casts || movie.actor || null,
          episodes,
          category: movie.category || {},
        },
      };
    } catch (error) {
      if (!options?.silent) console.error(`[PhimMoi] Detail ${slug}:`, error);
      return null;
    }
  }

  async getPhimMoi(page: number = 1): Promise<PhimResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/films/latest?page=${page}`, {
        headers: API_HEADERS,
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const items = (json.items || json.data?.items || []).map(
        (item: PhimMoiListItem): PhimItem => ({
          name: item.name || "",
          slug: item.slug || "",
          original_name: item.origin_name || item.original_name || "",
          thumb_url: item.thumb_url || item.poster || "",
          poster_url: item.poster_url || item.poster || item.thumb_url || "",
          created: item.created || "",
          modified: item.modified || "",
          description: item.content || item.description || "",
          total_episodes: item.total_episodes || item.episode_total || 0,
          current_episode: item.current_episode || item.episode_current || "",
          time: item.time || item.duration || "",
          quality: item.quality || "",
          language: item.language || item.lang || "",
          director: item.director || "",
          casts: item.casts || item.actor || null,
        })
      );

      const pagination = json.pagination || json.data?.params?.pagination || {};
      const itemsPerPage = pagination.totalItemsPerPage || pagination.limit || items.length || 24;
      const totalItems = pagination.totalItems || pagination.total || items.length;

      return {
        status: "success",
        paginate: {
          current_page: pagination.currentPage || pagination.page || 1,
          total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          total_items: totalItems,
          items_per_page: itemsPerPage,
        },
        items,
      };
    } catch (error) {
      console.error("[PhimMoi] getPhimMoi:", error);
      return null;
    }
  }

  async search(keyword: string, options?: { page?: number; limit?: number }): Promise<PhimResponse | null> {
    if (!keyword) return null;
    try {
      const params = new URLSearchParams({ keyword, page: String(options?.page || 1) });
      const res = await fetch(`${API_BASE}/search?${params.toString()}`, {
        headers: API_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = await res.json();
      const items = (json.items || json.data?.items || []).map(
        (item: PhimMoiListItem): PhimItem => ({
          name: item.name || "",
          slug: item.slug || "",
          original_name: item.origin_name || item.original_name || "",
          thumb_url: item.thumb_url || item.poster || "",
          poster_url: item.poster_url || item.poster || item.thumb_url || "",
          created: item.created || "",
          modified: item.modified || "",
          description: item.content || item.description || "",
          total_episodes: item.total_episodes || item.episode_total || 0,
          current_episode: item.current_episode || item.episode_current || "",
          time: item.time || item.duration || "",
          quality: item.quality || "",
          language: item.language || item.lang || "",
          director: item.director || "",
          casts: item.casts || item.actor || null,
        })
      );

      const pagination = json.pagination || json.data?.params?.pagination || {};
      const itemsPerPage = pagination.totalItemsPerPage || pagination.limit || items.length || 24;
      const totalItems = pagination.totalItems || pagination.total || items.length;

      return {
        status: "success",
        paginate: {
          current_page: pagination.currentPage || pagination.page || 1,
          total_page: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
          total_items: totalItems,
          items_per_page: itemsPerPage,
        },
        items,
      };
    } catch (error) {
      console.error("[PhimMoi] search:", error);
      return null;
    }
  }
}

/** Singleton instance */
export const phimmoiProvider = new PhimMoiProvider();
