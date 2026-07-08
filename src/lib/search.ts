import {
  PhimItem,
  comparePhimItems,
  searchPhim,
  getPhimDetail,
  getPhimMoi,
  getPhimTheoQuocGia,
} from "@/lib/api";

const SEARCH_CACHE_TTL_MS = 1000 * 60 * 5;
const MAX_SEARCH_PAGES = 3;
const LOCAL_POOL_TTL_MS = 1000 * 60 * 30;
const LOCAL_POOL_CONCURRENCY = 8;
const LOCAL_POOL_WAIT_MS = 15000;
const KNOWN_MOVIE_CACHE_LIMIT = 500;
const MAX_DETAIL_HYDRATION_ITEMS = 6;
const LOCAL_SEARCH_SOURCES = [
  { path: "viet-nam", pages: 30, fetcher: (page: number) => getPhimTheoQuocGia("viet-nam", page, { silent: true }) },
  { path: "phim-moi-cap-nhat", pages: 20, fetcher: (page: number) => getPhimMoi(page, { silent: true }) },
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
let localPoolPromise: Promise<PreparedMovie[]> | null = null;

const preparedMovieCache = new WeakMap<SearchableMovie, PreparedMovie>();
const knownMovieCache = new Map<string, SearchableMovie>();

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
    .replace(/[''`]/g, "")
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

function rememberMovie(item: SearchableMovie | null | undefined) {
  if (!item?.slug) return item || null;

  const existing = knownMovieCache.get(item.slug);
  const merged = existing ? { ...existing, ...item } : item;

  knownMovieCache.delete(item.slug);
  knownMovieCache.set(item.slug, merged);

  if (knownMovieCache.size > KNOWN_MOVIE_CACHE_LIMIT) {
    const oldestKey = knownMovieCache.keys().next().value;
    if (oldestKey) knownMovieCache.delete(oldestKey);
  }

  return merged;
}

function addMovieCandidate(
  movieMap: Map<string, SearchableMovie>,
  item: SearchableMovie | null | undefined,
) {
  const remembered = rememberMovie(item);

  if (remembered?.slug) {
    movieMap.set(remembered.slug, remembered);
  }
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function wait<T>(ms: number, value: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
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

async function fetchSearchResults(keyword: string) {
  if (!keyword) return [];

  // Fetch page 1 using the new searchPhim signature (page/limit options)
  const firstPageData = await searchPhim(keyword, { page: 1, limit: 24 });
  if (!firstPageData) return [];

  const movieMap = new Map<string, SearchableMovie>();

  for (const item of firstPageData.items || []) {
    addMovieCandidate(movieMap, item);
  }

  const totalPages = Math.min(
    firstPageData.paginate?.total_page || 1,
    MAX_SEARCH_PAGES,
  );

  if (totalPages <= 1) {
    return Array.from(movieMap.values());
  }

  // Fetch remaining pages in parallel
  const remainingPages = Array.from(
    { length: totalPages - 1 },
    (_, index) => index + 2,
  );

  const pageResults = await Promise.all(
    remainingPages.map((page) => searchPhim(keyword, { page, limit: 24 })),
  );

  for (const data of pageResults) {
    if (!data) continue;
    for (const item of data.items || []) {
      addMovieCandidate(movieMap, item);
    }
  }

  return Array.from(movieMap.values());
}

async function fetchMovieBySlug(slug: string) {
  if (!slug) return null;

  const data = await getPhimDetail(slug, { silent: true });
  return rememberMovie(data?.movie);
}

async function fetchListPage(fetcher: (page: number) => Promise<unknown>, page: number) {
  try {
    const data = await fetcher(page);
    return (data as { items?: PhimItem[] })?.items || [];
  } catch {
    return [];
  }
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

async function buildLocalSearchPool() {
  const now = Date.now();

  if (localPoolCache && localPoolCache.expiresAt > now) {
    return localPoolCache.items;
  }

  const movieMap = new Map<string, SearchableMovie>();
  const pageTasks = LOCAL_SEARCH_SOURCES.flatMap((source) =>
    Array.from(
      { length: source.pages },
      (_, index) => () => fetchListPage(source.fetcher, index + 1),
    ),
  );
  const pageResults = await runWithConcurrency(
    pageTasks,
    LOCAL_POOL_CONCURRENCY,
  );

  for (const items of pageResults) {
    for (const item of items) {
      addMovieCandidate(movieMap, item);
    }
  }

  const items = Array.from(movieMap.values()).map(prepareMovie);
  localPoolCache = {
    items,
    expiresAt: now + LOCAL_POOL_TTL_MS,
  };

  return items;
}

export async function getLocalSearchPool() {
  if (localPoolCache && localPoolCache.expiresAt > Date.now()) {
    return localPoolCache.items;
  }

  if (!localPoolPromise) {
    localPoolPromise = buildLocalSearchPool().finally(() => {
      localPoolPromise = null;
    });
  }

  return localPoolPromise;
}

async function getLocalSearchPoolWithinTimeout() {
  return Promise.race([
    getLocalSearchPool(),
    wait<PreparedMovie[]>(LOCAL_POOL_WAIT_MS, []),
  ]);
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

  const normalizedKeyword = normalizeSearchValue(trimmedKeyword);
  const cacheKey = [
    normalizedKeyword,
    limit || "all",
    preferredSlug ? `preferred:${preferredSlug}` : "",
  ]
    .filter(Boolean)
    .join(":");
  const cachedResult = searchResultCache.get(cacheKey);

  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.items;
  }

  const queryTokens = splitTokens(trimmedKeyword);
  const keywordSlug = slugifyKeyword(trimmedKeyword);
  const titleCaseKeyword = toTitleCase(normalizedKeyword);
  const queryVariants = Array.from(
    new Set(
      [
        trimmedKeyword,
        trimmedKeyword.toLowerCase(),
        normalizedKeyword,
        titleCaseKeyword,
        keywordSlug,
      ].filter(Boolean),
    ),
  );
  const preferredMoviePromise =
    preferredSlug && preferredSlug !== keywordSlug
      ? fetchMovieBySlug(preferredSlug)
      : Promise.resolve(null);
  const localPoolPromise = getLocalSearchPoolWithinTimeout();
  const [searchResultsList, slugMovie, preferredMovie] = await Promise.all([
    Promise.all(queryVariants.map(fetchSearchResults)),
    fetchMovieBySlug(keywordSlug),
    preferredMoviePromise,
  ]);

  const movieMap = new Map<string, SearchableMovie>();

  for (const resultItems of searchResultsList) {
    for (const item of resultItems) {
      addMovieCandidate(movieMap, item);
    }
  }

  addMovieCandidate(movieMap, slugMovie);
  addMovieCandidate(movieMap, preferredMovie);

  const detailHydrationItems = Array.from(movieMap.values()).slice(
    0,
    MAX_DETAIL_HYDRATION_ITEMS,
  );
  const hydratedItems = await Promise.all(
    detailHydrationItems.map((item) => fetchMovieBySlug(item.slug)),
  );

  for (const item of hydratedItems) {
    addMovieCandidate(movieMap, item);
  }

  const localPool = await localPoolPromise;

  for (const prepared of localPool) {
    const localScore = scorePreparedMovie(
      prepared,
      normalizedKeyword,
      queryTokens,
    );
    if (localScore > 0) {
      addMovieCandidate(movieMap, prepared.item);
    }
  }

  for (const item of Array.from(knownMovieCache.values())) {
    const knownScore = scorePreparedMovie(
      prepareMovie(item),
      normalizedKeyword,
      queryTokens,
    );

    if (knownScore > 0) {
      addMovieCandidate(movieMap, item);
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

  if (items.length > 0) {
    searchResultCache.set(cacheKey, {
      items,
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    });
  } else {
    searchResultCache.delete(cacheKey);
  }

  return items;
}
