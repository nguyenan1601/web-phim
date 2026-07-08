export interface EpisodeItem {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}

export interface EpisodeServer {
  server_name: string;
  items: EpisodeItem[];
  /** Provider source của server này (vd: "kkphim", "nguonc") */
  source?: string;
}

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
  category?: Record<string, { group: { id: string; name: string }; list: { id: string; name: string }[] }>;
}

export interface MovieDetail extends PhimItem {
  id: string;
  episodes: EpisodeServer[];
}

export interface FilmDetailResult {
  status?: string;
  movie: MovieDetail;
  /** Tên provider đã cung cấp dữ liệu này */
  source: string;
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

export interface ProviderDetail {
  name: string;
  label: string;
  priority: number; // lower = preferred first
}

export interface IMovieProvider {
  /** Tên định danh của provider (vd: "kkphim", "phimmoi") */
  readonly name: string;
  /** Tên hiển thị (vd: "KKPhim", "PhimMoi") */
  readonly label: string;
  /** Độ ưu tiên: thấp hơn = xài trước */
  readonly priority: number;

  /** Lấy chi tiết phim + episodes */
  getDetail(slug: string, options?: { silent?: boolean }): Promise<FilmDetailResult | null>;

  /** Lấy danh sách phim mới */
  getPhimMoi(page?: number): Promise<PhimResponse | null>;

  /** Tìm kiếm phim */
  search(keyword: string, options?: { page?: number; limit?: number }): Promise<PhimResponse | null>;
}

/**
 * IEpisodeProvider - Provider chỉ chuyên cung cấp episodes/servers.
 * Không lấy movie info, chỉ bổ sung thêm server phát.
 * Dùng để ghép (merge) vào kết quả từ IMovieProvider.
 */
export interface IEpisodeProvider {
  /** Tên định danh (vd: "nguonc", "m3u8provider") */
  readonly name: string;
  /** Tên hiển thị */
  readonly label: string;
  /** Độ ưu tiên: thấp hơn = được ưu tiên merge trước */
  readonly priority: number;

  /** Lấy danh sách server + tập phim cho một slug */
  getServers(
    slug: string,
    options?: { silent?: boolean; movieName?: string; originalName?: string }
  ): Promise<EpisodeServer[] | null>;
}
