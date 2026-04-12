const LOCAL_HISTORY_PREFIX = 'watch_history_';

function getKey(userId?: string): string {
  return LOCAL_HISTORY_PREFIX + (userId || 'guest');
}

export interface LocalHistoryItem {
  id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  episode_slug: string;
  episode_name: string;
  progress_seconds: number;
  total_seconds: number;
  updated_at: string;
}

export function getLocalHistory(userId?: string): LocalHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(getKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Lỗi lấy lịch sử local:', err);
    return [];
  }
}

export function saveLocalHistory(item: Omit<LocalHistoryItem, 'id' | 'updated_at'>, userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    let history = getLocalHistory(userId);
    const existingIndex = history.findIndex(h => h.movie_slug === item.movie_slug);
    
    const newItem: LocalHistoryItem = {
      ...item,
      id: existingIndex >= 0 ? history[existingIndex].id : crypto.randomUUID(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      history[existingIndex] = newItem;
    } else {
      history.push(newItem);
    }
    
    history.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    localStorage.setItem(getKey(userId), JSON.stringify(history));
  } catch (err) {
    console.error('Lỗi khi lưu lịch sử local:', err);
  }
}

export function removeLocalHistory(movieSlug: string, userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = getLocalHistory(userId);
    const newHistory = history.filter(h => h.movie_slug !== movieSlug);
    localStorage.setItem(getKey(userId), JSON.stringify(newHistory));
  } catch (err) {
    console.error('Lỗi khi xoá lịch sử local:', err);
  }
}

export function clearLocalHistory(userId?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getKey(userId));
  } catch (err) {
    console.error('Lỗi khi làm sạch lịch sử local:', err);
  }
}
