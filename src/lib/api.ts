const API_BASE = "https://phim.nguonc.com/api";

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
  category: Record<string, { group: { id: string; name: string }; list: { id: string; name: string }[] }>;
  episodes: EpisodeServer[];
}

export interface FilmDetailResponse {
  status?: string;
  movie: MovieDetail;
}

/**
 * Lấy danh sách phim mới cập nhật
 */
export async function getPhimMoi(page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 3600 } // Tự động cache 1 giờ ở Vercel Edge 
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Error fetching Phim Moi:", error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo danh mục (SLUG)
 */
export async function getPhimTheoDanhSach(slug: string, page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/danh-sach/${slug}?page=${page}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Danh Sach ${slug}:`, error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo thể loại
 */
export async function getPhimTheoTheLoai(slug: string, page: number = 1): Promise<PhimResponse | null> {
  if (!slug) return null;
  try {
    const res = await fetch(`${API_BASE}/films/the-loai/${slug}?page=${page}`, {
      next: { revalidate: 86400 } // Danh sách theo thể loại lưu kho 24h
    });
    if (!res.ok) {
      console.warn(`Fetch failed for genre ${slug}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching The Loai ${slug}:`, error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo quốc gia
 */
export async function getPhimTheoQuocGia(slug: string, page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/quoc-gia/${slug}?page=${page}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Quoc Gia ${slug}:`, error);
    return null;
  }
}

/**
 * Lấy danh sách phim theo năm phát hành
 */
export async function getPhimTheoNam(year: string, page: number = 1): Promise<PhimResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/films/nam-phat-hanh/${year}?page=${page}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Nam ${year}:`, error);
    return null;
  }
}

/**
 * Lấy chi tiết thông tin phim & danh sách tập video
 */
export async function getPhimDetail(slug: string): Promise<FilmDetailResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/film/${slug}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Detail ${slug}:`, error);
    return null;
  }
}

/**
 * Tìm kiếm phim bằng từ khóa
 */
export async function searchPhim(keyword: string): Promise<PhimResponse | null> {
  if (!keyword) return null;
  try {
    // Tìm kiếm không nên Cache
    const res = await fetch(`${API_BASE}/films/search?keyword=${encodeURIComponent(keyword)}`, {
      cache: "no-store" 
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (error) {
    console.error(`Error searching phim:`, error);
    return null;
  }
}
