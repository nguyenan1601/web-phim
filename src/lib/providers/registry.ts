import type { IMovieProvider, IEpisodeProvider, EpisodeServer, FilmDetailResult, PhimResponse, ProviderDetail } from "./types";
import { kkphimProvider } from "./kkphim";
import { nguoncProvider } from "./nguonc";

/**
 * ProviderRegistry
 *
 * Quản lý tất cả movie provider. Cho phép:
 * - Đăng ký provider động
 * - Fallback: thử lần lượt theo priority
 * - Merge kết quả từ nhiều nguồn
 */
class ProviderRegistry {
  private providers: Map<string, IMovieProvider> = new Map();
  private episodeProviders: Map<string, IEpisodeProvider> = new Map();
  private sortedCache: IMovieProvider[] | null = null;
  private episodeSortedCache: IEpisodeProvider[] | null = null;

  constructor() {
    // Đăng ký provider mặc định
    this.register(nguoncProvider);
    this.register(kkphimProvider);
    // Đăng ký episode providers mặc định
    this.registerEpisode(nguoncProvider);
    this.registerEpisode(kkphimProvider);
  }

  /** Đăng ký một provider mới */
  register(provider: IMovieProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(`[Registry] Provider "${provider.name}" already registered, overwriting`);
    }
    this.providers.set(provider.name, provider);
    this.sortedCache = null; // invalidate cache
  }

  /** Đăng ký một episode provider mới */
  registerEpisode(provider: IEpisodeProvider): void {
    if (this.episodeProviders.has(provider.name)) {
      console.warn(`[Registry] EpisodeProvider "${provider.name}" already registered, overwriting`);
    }
    this.episodeProviders.set(provider.name, provider);
    this.episodeSortedCache = null;
  }

  /** Lấy danh sách tất cả episode providers, sắp xếp theo priority */
  getAllEpisodeProviders(): IEpisodeProvider[] {
    if (!this.episodeSortedCache) {
      this.episodeSortedCache = Array.from(this.episodeProviders.values()).sort(
        (a, b) => a.priority - b.priority
      );
    }
    return this.episodeSortedCache;
  }

  /** Lấy episode provider theo tên */
  getEpisode(name: string): IEpisodeProvider | undefined {
    return this.episodeProviders.get(name);
  }

  /** Lấy danh sách episode server details (dùng cho UI) */
  getEpisodeProviderDetails(): ProviderDetail[] {
    return this.getAllEpisodeProviders().map((p) => ({
      name: p.name,
      label: p.label,
      priority: p.priority,
    }));
  }

  /**
   * Lấy servers từ tất cả episode providers, gộp lại.
   * Mỗi provider trả về danh sách server riêng → merge thành 1 mảng.
   * Mỗi server được gắn field `source` để biết từ provider nào.
   */
  async getMergedServers(
    slug: string,
    options?: { silent?: boolean; movieName?: string; originalName?: string }
  ): Promise<EpisodeServer[]> {
    const all = this.getAllEpisodeProviders();
    const results = await Promise.allSettled(
      all.map((p) =>
        p.getServers(slug, {
          silent: options?.silent ?? true,
          movieName: options?.movieName,
          originalName: options?.originalName,
        }).then((servers) => ({
          sourceName: p.name,
          servers: servers || [],
        }))
      )
    );

    const merged: EpisodeServer[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const server of result.value.servers) {
          server.source = result.value.sourceName;
          merged.push(server);
        }
      }
    }
    return merged;
  }

  /**
   * Lấy detail phim + episodes đã gộp từ tất cả episode providers.
   *
   * 1. Lấy movie info từ movie provider (fallback qua multi)
   * 2. Query tất cả episode providers để lấy thêm servers
   * 3. Merge episodes: servers từ episode providers được thêm vào cuối
   */
  async getDetailWithMergedServers(
    slug: string,
    options?: { silent?: boolean; preferredProvider?: string }
  ): Promise<FilmDetailResult | null> {
    // Bước 1: lấy movie info
    const baseResult = await this.getDetailFallback(slug, { silent: true, preferredProvider: options?.preferredProvider });
    if (!baseResult) return null;

    for (const server of baseResult.movie.episodes || []) {
      server.source = baseResult.source;
    }

    // Bước 2: lấy servers từ episode providers
    const extraServers = await this.getMergedServers(slug, {
      silent: options?.silent,
      movieName: baseResult.movie.name,
      originalName: baseResult.movie.original_name,
    });

    // Bước 3: merge (server từ movie provider giữ nguyên, thêm extra servers)
    if (extraServers.length > 0) {
      const existingServers = new Set(
        (baseResult.movie.episodes || []).map((s) => `${s.source || ""}:${s.server_name}`)
      );

      // Chỉ thêm server mới chưa tồn tại
      for (const server of extraServers) {
        const serverKey = `${server.source || ""}:${server.server_name}`;
        if (!existingServers.has(serverKey)) {
          baseResult.movie.episodes.push(server);
          existingServers.add(serverKey);
        }
      }
    }

    return baseResult;
  }

  /** Lấy danh sách tất cả providers, sắp xếp theo priority */
  getAll(): IMovieProvider[] {
    if (!this.sortedCache) {
      this.sortedCache = Array.from(this.providers.values()).sort(
        (a, b) => a.priority - b.priority
      );
    }
    return this.sortedCache;
  }

  /** Lấy provider theo tên */
  get(name: string): IMovieProvider | undefined {
    return this.providers.get(name);
  }

  /** Danh sách provider details (dùng cho UI) */
  getDetails(): ProviderDetail[] {
    return this.getAll().map((p) => ({
      name: p.name,
      label: p.label,
      priority: p.priority,
    }));
  }

  /**
   * Lấy chi tiết phim, fallback qua các providers theo priority.
   * Trả về kết quả từ provider đầu tiên thành công.
   */
  async getDetailFallback(
    slug: string,
    options?: { silent?: boolean; preferredProvider?: string }
  ): Promise<FilmDetailResult | null> {
    const allProviders = this.getAll();

    // Nếu có preferred, thử nó trước
    if (options?.preferredProvider) {
      const preferred = this.get(options.preferredProvider);
      if (preferred) {
        const result = await preferred.getDetail(slug, options);
        if (result) return result;
      }
    }

    // Fallback qua tất cả providers theo priority
    for (const provider of allProviders) {
      if (options?.preferredProvider && provider.name === options.preferredProvider) continue;
      const result = await provider.getDetail(slug, options);
      if (result) {
        if (!options?.silent) {
          console.log(`[Registry] Detail for "${slug}" resolved by ${provider.label}`);
        }
        return result;
      }
    }

    if (!options?.silent) {
      console.warn(`[Registry] No provider found for "${slug}"`);
    }
    return null;
  }

  /**
   * Lấy chi tiết từ TẤT CẢ providers (dùng để merge/show multi-source).
   * Chỉ trả về các kết quả thành công.
   */
  async getDetailFromAll(
    slug: string,
    options?: { silent?: boolean }
  ): Promise<FilmDetailResult[]> {
    const allProviders = this.getAll();
    const results = await Promise.allSettled(
      allProviders.map((p) => p.getDetail(slug, options))
    );

    const successful: FilmDetailResult[] = [];
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value !== null) {
        successful.push(result.value);
      }
    });

    return successful;
  }

  /** Lấy danh sách phim mới (chỉ từ provider priority cao nhất, fallback nếu cần) */
  async getPhimMoi(page?: number): Promise<PhimResponse | null> {
    const allProviders = this.getAll();
    for (const provider of allProviders) {
      const result = await provider.getPhimMoi(page);
      if (result) return result;
    }
    return null;
  }

  /** Tìm kiếm phim (chỉ từ provider priority cao nhất, fallback nếu cần) */
  async search(keyword: string, options?: { page?: number; limit?: number }): Promise<PhimResponse | null> {
    const allProviders = this.getAll();
    for (const provider of allProviders) {
      const result = await provider.search(keyword, options);
      if (result) return result;
    }
    return null;
  }
}

/** Global singleton instance */
export const providerRegistry = new ProviderRegistry();
