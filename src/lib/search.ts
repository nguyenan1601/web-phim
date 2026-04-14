import type { PhimItem, PhimResponse } from "@/lib/api";

const API_BASE = "https://phim.nguonc.com/api";
const LOCAL_POOL_TTL_MS = 1000 * 60 * 30;
const LOCAL_SEARCH_SOURCES = [
  { path: "/films/quoc-gia/viet-nam", pages: 30 },
  { path: "/films/phim-moi-cap-nhat", pages: 20 },
];

type SearchableMovie = PhimItem;

let localPoolCache:
  | {
      expiresAt: number;
      items: SearchableMovie[];
    }
  | null = null;

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugifyKeyword(value: string | null | undefined) {
  return normalizeSearchValue(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitTokens(value: string | null | undefined) {
  return normalizeSearchValue(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function levenshteinDistance(source: string, target: string) {
  if (source === target) return 0;
  if (!source.length) return target.length;
  if (!target.length) return source.length;

  const previous = Array.from({ length: target.length + 1 }, (_, index) => index);
  const current = new Array<number>(target.length + 1);

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    for (let j = 0; j <= target.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[target.length];
}

function getFuzzyAllowance(token: string) {
  if (token.length <= 4) return 1;
  if (token.length <= 8) return 2;
  return 3;
}

function hasFuzzyTokenMatch(queryTokens: string[], fieldValue: string) {
  if (queryTokens.length === 0 || !fieldValue) return false;
  const fieldTokens = splitTokens(fieldValue);

  if (fieldTokens.length === 0) return false;

  return queryTokens.every((queryToken) =>
    fieldTokens.some((fieldToken) => {
      if (fieldToken.includes(queryToken) || queryToken.includes(fieldToken)) {
        return true;
      }

      return levenshteinDistance(queryToken, fieldToken) <= getFuzzyAllowance(queryToken);
    })
  );
}

function scoreMovie(item: SearchableMovie, keyword: string) {
  const normalizedKeyword = normalizeSearchValue(keyword);
  const queryTokens = splitTokens(keyword);

  const normalizedName = normalizeSearchValue(item.name);
  const normalizedOriginalName = normalizeSearchValue(item.original_name);
  const normalizedSlug = normalizeSearchValue(item.slug);
  const normalizedDirector = normalizeSearchValue(item.director);
  const normalizedCasts = normalizeSearchValue(item.casts);
  const normalizedDescription = normalizeSearchValue(item.description);

  let score = 0;

  if (
    normalizedName === normalizedKeyword ||
    normalizedOriginalName === normalizedKeyword ||
    normalizedSlug === normalizedKeyword
  ) {
    score += 1200;
  }

  if (
    normalizedName.startsWith(normalizedKeyword) ||
    normalizedOriginalName.startsWith(normalizedKeyword)
  ) {
    score += 800;
  }

  if (normalizedName.includes(normalizedKeyword)) {
    score += 600;
  }

  if (normalizedOriginalName.includes(normalizedKeyword)) {
    score += 480;
  }

  if (normalizedSlug.includes(normalizedKeyword)) {
    score += 420;
  }

  if (normalizedDirector.includes(normalizedKeyword)) {
    score += 320;
  }

  if (normalizedCasts.includes(normalizedKeyword)) {
    score += 300;
  }

  if (normalizedDescription.includes(normalizedKeyword)) {
    score += 120;
  }

  if (hasFuzzyTokenMatch(queryTokens, item.name)) {
    score += 260;
  }

  if (hasFuzzyTokenMatch(queryTokens, item.original_name)) {
    score += 220;
  }

  if (hasFuzzyTokenMatch(queryTokens, item.director)) {
    score += 170;
  }

  if (hasFuzzyTokenMatch(queryTokens, item.casts || "")) {
    score += 170;
  }

  return score;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchSearchPage(keyword: string) {
  if (!keyword) return [];

  const data = await fetchJson<PhimResponse>(
    `${API_BASE}/films/search?keyword=${encodeURIComponent(keyword)}`,
    { cache: "no-store" }
  );

  return Array.isArray(data?.items) ? data.items : [];
}

async function fetchMovieBySlug(slug: string) {
  if (!slug) return null;

  const data = await fetchJson<{ movie?: SearchableMovie }>(`${API_BASE}/film/${slug}`, {
    next: { revalidate: 3600 },
  });

  return data?.movie || null;
}

async function fetchListPage(path: string, page: number) {
  const data = await fetchJson<PhimResponse>(`${API_BASE}${path}?page=${page}`, {
    next: { revalidate: 3600 },
  });

  return Array.isArray(data?.items) ? data.items : [];
}

async function getLocalSearchPool() {
  const now = Date.now();

  if (localPoolCache && localPoolCache.expiresAt > now) {
    return localPoolCache.items;
  }

  const movieMap = new Map<string, SearchableMovie>();

  for (const source of LOCAL_SEARCH_SOURCES) {
    for (let page = 1; page <= source.pages; page += 1) {
      const items = await fetchListPage(source.path, page);

      for (const item of items) {
        if (!movieMap.has(item.slug)) {
          movieMap.set(item.slug, item);
        }
      }
    }
  }

  const items = Array.from(movieMap.values());
  localPoolCache = {
    items,
    expiresAt: now + LOCAL_POOL_TTL_MS,
  };

  return items;
}

export async function searchPhimAdvanced(keyword: string) {
  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword.length < 2) {
    return [];
  }

  const normalizedKeyword = normalizeSearchValue(trimmedKeyword);
  const keywordSlug = slugifyKeyword(trimmedKeyword);
  const queryVariants = Array.from(new Set([trimmedKeyword, normalizedKeyword].filter(Boolean)));
  const [searchResultsList, slugMovie, localPool] = await Promise.all([
    Promise.all(queryVariants.map(fetchSearchPage)),
    fetchMovieBySlug(keywordSlug),
    getLocalSearchPool(),
  ]);

  const movieMap = new Map<string, SearchableMovie>();

  for (const resultItems of searchResultsList) {
    for (const item of resultItems) {
      if (item?.slug && !movieMap.has(item.slug)) {
        movieMap.set(item.slug, item);
      }
    }
  }

  if (slugMovie?.slug) {
    movieMap.set(slugMovie.slug, slugMovie);
  }

  for (const item of localPool) {
    const localScore = scoreMovie(item, trimmedKeyword);
    if (localScore > 0 && !movieMap.has(item.slug)) {
      movieMap.set(item.slug, item);
    }
  }

  return Array.from(movieMap.values())
    .map((item) => ({
      item,
      score: scoreMovie(item, trimmedKeyword),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (
        new Date(right.item.modified || right.item.created || 0).getTime() -
        new Date(left.item.modified || left.item.created || 0).getTime()
      );
    })
    .map((entry) => entry.item);
}
