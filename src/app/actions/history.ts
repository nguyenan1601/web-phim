'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateHistoryAction(data: {
  movie_slug: string
  movie_name: string
  movie_thumb?: string
  episode_slug: string
  episode_name: string
  progress_seconds: number
  total_seconds: number
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Use upsert or unique constraint logic
  // The schema has unique(user_id, movie_slug)
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
