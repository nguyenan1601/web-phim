'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function toggleFavoriteAction(movie: {
  slug: string
  name: string
  thumb_url: string
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Vui lòng đăng nhập để lưu phim yêu thích' }

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('movie_slug', movie.slug)
    .single()

  if (existing) {
    // Ungrateful removal
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidatePath('/yeu-thich')
    return { success: true, action: 'removed' }
  } else {
    // Add to favorites
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        movie_slug: movie.slug,
        movie_name: movie.name,
        movie_thumb: movie.thumb_url,
      })

    if (error) return { error: error.message }
    revalidatePath('/yeu-thich')
    return { success: true, action: 'added' }
  }
}

export async function getFavoritesAction() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }

  return data
}

export async function removeFavoriteAction(movieSlug: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('movie_slug', movieSlug)

  if (error) return { error: error.message }
  revalidatePath('/yeu-thich')
  return { success: true }
}

export async function checkIsFavoriteAction(movieSlug: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('movie_slug', movieSlug)
    .single()

  return !!data
}
