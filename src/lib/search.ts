import { PhimItem, PhimResponse, comparePhimItems } from "@/lib/api";

const API_BASE = "https://phim.nguonc.com/api";
const API_HEADERS = {
  accept: "application/json, text/plain, */*",
  referer: "https://phim.nguonc.com/",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
};
const LOCAL_POOL_TTL_MS = 1000 * 60 * 30;
const SEARCH_CACHE_TTL_MS = 1000 * 60 * 5;
const FETCH_TIMEOUT_MS = 3000;
const MAX_SEARCH_PAGES = 3;
const LOCAL_POOL_CONCURRENCY = 8;
const LOCAL_SEARCH_SOURCES = [
  { path: "/films/quoc-gia/viet-nam", pages: 30 },
  { path: "/films/phim-moi-cap-nhat", pages: 20 },
];

type SearchableMovie = PhimItem;
type PreparedMovie = {
  item: SearchableMovie;
  normalizedName: string;
  normalizedOriginalName: string;
  normalizedSlug: string;
  nameTokens: string[];
  originalNameTokens: string[];
  slugTokens: string[];
};

let localPoolCache: {
  expiresAt: number;
  items: PreparedMovie[];
} | null = null;

const preparedMovieCache = new WeakMap<SearchableMovie, PreparedMovie>();

const searchResultCache = new Map<
  string,
  {
    expiresAt: number;
    items: SearchableMovie[];
  }
>();

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/['’`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyKeyword(value: string | null | undefined) {
  return normalizeSearchValue(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitTokens(value: string | null | undefined) {
  return normalizeSearchValue(value).split(/\s+/).filter(Boolean);
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function levenshteinDistance(source: string, target: string) {
  if (source === target) return 0;
  if (!source.length) return target.length;
  if (!target.length) return source.length;

  const previous = Array.from(
    { length: target.length + 1 },
    (_, index) => index,
  );
  const current = new Array<number>(target.length + 1);

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
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

function hasFuzzyTokenMatch(queryTokens: string[], fieldTokens: string[]) {
  if (queryTokens.length === 0 || fieldTokens.length === 0) return false;

  return queryTokens.every((queryToken) =>
    fieldTokens.some((fieldToken) => {
      if (fieldToken.includes(queryToken)) {
        return true;
      }

      if (fieldToken.length >= 3 && queryToken.includes(fieldToken)) {
        return true;
      }

      return (
        levenshteinDistance(queryToken, fieldToken) <=
        getFuzzyAllowance(queryToken)
      );
    }),
  );
}

function prepareMovie(item: SearchableMovie): PreparedMovie {
  const cached = preparedMovieCache.get(item);
  if (cached) return cached;

  const prepared = {
    item,
    normalizedName: normalizeSearchValue(item.name),
    normalizedOriginalName: normalizeSearchValue(item.original_name),
    normalizedSlug: normalizeSearchValue(item.slug),
    nameTokens: splitTokens(item.name),
    originalNameTokens: splitTokens(item.original_name),
    slugTokens: splitTokens(item.slug),
  };

  preparedMovieCache.set(item, prepared);
  return prepared;
}

function scorePreparedMovie(
  prepared: PreparedMovie,
  normalizedKeyword: string,
  queryTokens: string[],
) {
  const { normalizedName, normalizedOriginalName, normalizedSlug } = prepared;

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

  if (score < 600 && hasFuzzyTokenMatch(queryTokens, prepared.nameTokens)) {
    score += 260;
  }

  if (score < 600 && hasFuzzyTokenMatch(queryTokens, prepared.originalNameTokens)) {
    score += 220;
  }

  if (score < 600 && hasFuzzyTokenMatch(queryTokens, prepared.slugTokens)) {
    score += 200;
  }

  return score;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...API_HEADERS,
        ...init?.headers,
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchSearchPage(keyword: string, page = 1) {
  if (!keyword) return null;

  return fetchJson<PhimResponse>(
    `${API_BASE}/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
    { cache: "no-store" },
  );
}

async function fetchSearchResults(keyword: string) {
  const firstPage = await fetchSearchPage(keyword, 1);
  if (!firstPage) return [];

  const movieMap = new Map<string, SearchableMovie>();

  for (const item of firstPage.items || []) {
    if (item?.slug && !movieMap.has(item.slug)) {
      movieMap.set(item.slug, item);
    }
  }

  const totalPages = Math.min(
    firstPage.paginate?.total_page || 1,
    MAX_SEARCH_PAGES,
  );
  const remainingPages = Array.from(
    { length: Math.max(totalPages - 1, 0) },
    (_, index) => index + 2,
  );

  const pageResults = await Promise.all(
    remainingPages.map((page) => fetchSearchPage(keyword, page)),
  );

  for (const data of pageResults) {
    for (const item of data?.items || []) {
      if (item?.slug && !movieMap.has(item.slug)) {
        movieMap.set(item.slug, item);
      }
    }
  }

  return Array.from(movieMap.values());
}

async function fetchMovieBySlug(slug: string) {
  if (!slug) return null;

  const data = await fetchJson<{ movie?: SearchableMovie }>(
    `${API_BASE}/film/${slug}`,
    {
      next: { revalidate: 3600 },
    },
  );

  return data?.movie || null;
}

async function fetchListPage(path: string, page: number) {
  const data = await fetchJson<PhimResponse>(
    `${API_BASE}${path}?page=${page}`,
    {
      next: { revalidate: 3600 },
    },
  );

  return Array.isArray(data?.items) ? data.items : [];
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
) {
  const results: T[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );

  return results;
}

async function getLocalSearchPool() {
  const now = Date.now();

  if (localPoolCache && localPoolCache.expiresAt > now) {
    return localPoolCache.items;
  }

  const movieMap = new Map<string, SearchableMovie>();
  const pageTasks = LOCAL_SEARCH_SOURCES.flatMap((source) =>
    Array.from(
      { length: source.pages },
      (_, index) => () => fetchListPage(source.path, index + 1),
    ),
  );
  const pageResults = await runWithConcurrency(
    pageTasks,
    LOCAL_POOL_CONCURRENCY,
  );

  for (const items of pageResults) {
    for (const item of items) {
      if (item?.slug && !movieMap.has(item.slug)) {
        movieMap.set(item.slug, item);
      }
    }
  }

  const items = Array.from(movieMap.values()).map(prepareMovie);
  localPoolCache = {
    items,
    expiresAt: now + LOCAL_POOL_TTL_MS,
  };

  return items;
}

type SearchOptions = {
  limit?: number;
  preferredSlug?: string;
};

export async function searchPhimAdvanced(
  keyword: string,
  preferredSlugOrOptions?: string | SearchOptions,
) {
  const trimmedKeyword = keyword.trim();
  const options =
    typeof preferredSlugOrOptions === "string"
      ? { preferredSlug: preferredSlugOrOptions }
      : preferredSlugOrOptions || {};
  const { limit, preferredSlug } = options;

  if (trimmedKeyword.length < 2) {
    return [];
  }

  const cacheKey = `${normalizeSearchValue(trimmedKeyword)}:${limit || "all"}`;
  const cachedResult = searchResultCache.get(cacheKey);

  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.items;
  }

  const normalizedKeyword = normalizeSearchValue(trimmedKeyword);
  const queryTokens = splitTokens(trimmedKeyword);
  const keywordSlug = slugifyKeyword(trimmedKeyword);
  const titleCaseKeyword = toTitleCase(normalizedKeyword);
  const queryVariants = Array.from(
    new Set(
      [trimmedKeyword, normalizedKeyword, titleCaseKeyword, keywordSlug].filter(
        Boolean,
      ),
    ),
  );
  const preferredMoviePromise =
    preferredSlug && preferredSlug !== keywordSlug
      ? fetchMovieBySlug(preferredSlug)
      : Promise.resolve(null);
  const [searchResultsList, slugMovie, preferredMovie, localPool] = await Promise.all([
    Promise.all(queryVariants.map(fetchSearchResults)),
    fetchMovieBySlug(keywordSlug),
    preferredMoviePromise,
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

  if (preferredMovie?.slug) {
    movieMap.set(preferredMovie.slug, preferredMovie);
  }

  for (const prepared of localPool) {
    const localScore = scorePreparedMovie(
      prepared,
      normalizedKeyword,
      queryTokens,
    );
    if (localScore > 0 && !movieMap.has(prepared.item.slug)) {
      movieMap.set(prepared.item.slug, prepared.item);
    }
  }

  const items = Array.from(movieMap.values())
    .map((item) => {
      const prepared = prepareMovie(item);
      return {
        item,
        score:
          item.slug === preferredMovie?.slug
            ? scorePreparedMovie(prepared, normalizedKeyword, queryTokens) + 2000
            : scorePreparedMovie(prepared, normalizedKeyword, queryTokens),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return comparePhimItems(left.item, right.item);
    })
    .map((entry) => entry.item)
    .slice(0, limit);

  searchResultCache.set(cacheKey, {
    items,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  return items;
}
