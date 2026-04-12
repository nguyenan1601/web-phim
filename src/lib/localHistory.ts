const LOCAL_HISTORY_KEY = 'watch_history_local';

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

export function getLocalHistory(): LocalHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalHistory(item: Omit<LocalHistoryItem, 'id' | 'updated_at'>) {
  if (typeof window === 'undefined') return;
  try {
    let history = getLocalHistory();
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
    if (history.length > 100) history = history.slice(0, 100);

    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Error saving local history:', err);
  }
}

export function removeLocalHistory(movieSlug: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = getLocalHistory();
    const filtered = history.filter(h => h.movie_slug !== movieSlug);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error removing local history:', err);
  }
}

export function clearLocalHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEY);
  } catch (err) {
    console.error('Error clearing local history:', err);
  }
}
