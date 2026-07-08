import type { IEpisodeProvider, EpisodeServer, EpisodeItem } from "./types";

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
const API_BASE = "https://phim.nguonc.com/api";
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

interface NguoncDetailResponse {
  status?: boolean | string;
  msg?: string;
  movie?: Record<string, unknown>;
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

async function fetchDetail(slug: string) {
  const res = await fetch(`${API_BASE}/film/${slug}`, {
    headers: API_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  return (await res.json()) as NguoncDetailResponse;
}

async function resolveSlugBySearch(keywords: string[]) {
  const targets = keywords.map(normalizeSearchText).filter(Boolean);
  if (targets.length === 0) return null;

  for (const keyword of keywords) {
    if (!keyword) continue;

    const params = new URLSearchParams({ keyword });
    const res = await fetch(`${API_BASE}/films/search?${params.toString()}`, {
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

export class NguoncEpisodeProvider implements IEpisodeProvider {
  readonly name = "nguonc";
  readonly label = "NguonC";
  readonly priority = 10;

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
