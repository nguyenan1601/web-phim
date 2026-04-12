'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface HistoryItem {
  movie_slug: string
  movie_name: string
  movie_thumb?: string
  episode_slug: string
  episode_name: string
  progress_seconds: number
  total_seconds: number
  updated_at?: string
}

export async function updateHistoryAction(data: HistoryItem) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Kiểm tra dữ liệu hiện tại để tránh ghi đè "thời gian = 0" 
  // do lỗi load chậm trên thiết bị mới (mount overwrite)
  if (data.progress_seconds === 0) {
    const { data: existing } = await supabase
      .from('watch_history')
      .select('progress_seconds, episode_slug')
      .eq('user_id', user.id)
      .eq('movie_slug', data.movie_slug)
      .maybeSingle()

    // Nếu cùng tập và trong DB đã có progress > 0, không ghi đè bằng 0
    if (existing && existing.episode_slug === data.episode_slug && (existing.progress_seconds || 0) > 0) {
      return { success: true, message: 'Preserved existing progress' }
    }
  }

  // 2. Thực hiện cập nhật
  const { error } = await supabase
    .from('watch_history')
    .upsert({
      user_id: user.id,
      movie_slug: data.movie_slug,
      movie_name: data.movie_name,
      movie_thumb: data.movie_thumb,
      episode_slug: data.episode_slug,
      episode_name: data.episode_name,
      progress_seconds: data.progress_seconds,
      total_seconds: data.total_seconds,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,movie_slug' })

  if (error) {
    console.error('Error updating history:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/lich-su')

  return { success: true }
}

/**
 * Đồng bộ hàng loạt từ localStorage lên Database khi người dùng đăng nhập
 */
export async function syncHistoryAction(items: HistoryItem[]) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!items || items.length === 0) return { success: true }

  // Chuẩn bị dữ liệu để upsert
  const syncData = items.map(item => ({
    user_id: user.id,
    movie_slug: item.movie_slug,
    movie_name: item.movie_name,
    movie_thumb: item.movie_thumb,
    episode_slug: item.episode_slug,
    episode_name: item.episode_name,
    progress_seconds: item.progress_seconds,
    total_seconds: item.total_seconds,
    updated_at: item.updated_at || new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('watch_history')
    .upsert(syncData, { onConflict: 'user_id,movie_slug' })

  if (error) {
    console.error('Error syncing history:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/lich-su')
  return { success: true }
}

export async function getHistoryAction() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error)
    return []
  }

  return data
}

export async function deleteHistoryAction(movieSlug: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', user.id)
    .eq('movie_slug', movieSlug)

  if (error) return { error: error.message }
  revalidatePath('/lich-su')
  revalidatePath('/')
  return { success: true }
}

export async function clearAllHistoryAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
  
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
  
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', user.id)
  
    if (error) return { error: error.message }
    revalidatePath('/lich-su')
    revalidatePath('/')
    return { success: true }
  }
