import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AvatarBackground {
  id: string
  name: string
  type: 'color' | 'image'
  value: string
  text_color?: string
  text_shadow?: string
  text_size?: string
  text_weight?: string
  text_family?: string
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string
}

let hasLoggedLoadError = false
let cachedBackgrounds: AvatarBackground[] | null = null
let backgroundsPromise: Promise<AvatarBackground[]> | null = null

async function fetchBackgroundsOnce(): Promise<AvatarBackground[]> {
  try {
    // Tentativo completo (admin)
    let { data, error, status } = await supabase
      .from('avatar_assets')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      // Fallback pubblico: solo predefiniti e default-avatar
      const results: AvatarBackground[] = []

      const d1 = await supabase
        .from('avatar_assets')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!d1.error && d1.data) results.push(...(d1.data as any))

      const d2 = await supabase
        .from('avatar_assets')
        .select('*')
        .in('name', ['default-avatar', 'default_avatar', 'Default Avatar'])
        .order('created_at', { ascending: true })
        .limit(1)

      if (!d2.error && d2.data) {
        const ids = new Set(results.map(r => r.id))
        for (const r of d2.data as any) if (!ids.has(r.id)) results.push(r)
      }

      if (results.length > 0) {
        data = results
      } else {
        if (!hasLoggedLoadError) {
          console.warn('[avatar] load fallback failed', { error, status, d1Err: d1.error, d2Err: d2.error })
          hasLoggedLoadError = true
        }
        data = []
      }
    }

    const typed = (data || []).map(item => ({
      ...item,
      type: (item as any).type as 'color' | 'image'
    })) as AvatarBackground[]

    return typed
  } catch (err) {
    if (!hasLoggedLoadError) {
      console.warn('[avatar] unexpected load error', err)
      hasLoggedLoadError = true
    }
    return []
  }
}

export const useAvatarBackgrounds = () => {
  const [backgrounds, setBackgrounds] = useState<AvatarBackground[]>(cachedBackgrounds || [])
  const [loading, setLoading] = useState(!cachedBackgrounds)

  useEffect(() => {
    let canceled = false
    async function ensure() {
      if (cachedBackgrounds) { setLoading(false); setBackgrounds(cachedBackgrounds); return }
      try {
        setLoading(true)
        backgroundsPromise = backgroundsPromise || fetchBackgroundsOnce()
        const data = await backgroundsPromise
        if (canceled) return
        cachedBackgrounds = data
        backgroundsPromise = null
        setBackgrounds(data)
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    ensure()
    return () => { canceled = true }
  }, [])

  const reload = async () => {
    cachedBackgrounds = null
    backgroundsPromise = null
    const data = await fetchBackgroundsOnce()
    cachedBackgrounds = data
    setBackgrounds(data)
  }

  const createBackground = async (background: Omit<AvatarBackground, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')
      const { error } = await supabase.from('avatar_assets').insert({ ...background, created_by: user.user.id })
      if (error) throw error
      toast.success('Elemento avatar creato con successo')
    } catch (error) {
      console.error('Error creating background:', error)
      toast.error('Errore nella creazione dell\'elemento avatar')
    } finally {
      await reload()
    }
  }

  const updateBackground = async (id: string, updates: Partial<Pick<AvatarBackground, 'name' | 'type' | 'value' | 'text_color' | 'text_shadow' | 'text_size' | 'text_weight' | 'text_family'>>) => {
    try {
      const { error } = await supabase.from('avatar_assets').update(updates).eq('id', id)
      if (error) throw error
      toast.success('Elemento avatar aggiornato')
    } catch (error) {
      console.error('Error updating background:', error)
      toast.error('Errore nell\'aggiornamento dell\'elemento')
    } finally {
      await reload()
    }
  }

  const deleteBackground = async (id: string) => {
    try {
      const { error } = await supabase.from('avatar_assets').delete().eq('id', id)
      if (error) throw error
      toast.success('Elemento avatar eliminato')
    } catch (error) {
      console.error('Error deleting background:', error)
      toast.error('Errore nell\'eliminazione dell\'elemento')
    } finally {
      await reload()
    }
  }

  const setAsDefaultBackground = async (id: string) => {
    try {
      await supabase.from('avatar_assets').update({ is_default: false }).neq('id', id)
      const { error } = await supabase.from('avatar_assets').update({ is_default: true }).eq('id', id)
      if (error) throw error
      toast.success('Sfondo predefinito aggiornato')
    } catch (error) {
      console.error('Error setting default background:', error)
      toast.error('Errore nell\'impostazione dello sfondo predefinito')
    } finally {
      await reload()
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-bg-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Errore nel caricamento dell\'immagine')
    }
  }

  const defaultBackground = backgrounds.find(bg => bg.is_default) || null
  const defaultAvatarCandidate = backgrounds.find(bg =>
    bg.type === 'image' && ['default-avatar', 'default_avatar', 'default avatar'].includes((bg.name || '').toLowerCase())
  )
  const defaultAvatarImageUrl = defaultAvatarCandidate?.value || (import.meta as any)?.env?.VITE_DEFAULT_AVATAR_URL || null

  return {
    backgrounds,
    loading,
    defaultBackground,
    defaultAvatarImageUrl,
    createBackground,
    updateBackground,
    deleteBackground,
    setAsDefaultBackground,
    uploadImage
  }
}
