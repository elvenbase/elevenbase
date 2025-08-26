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
    // Team-first, then personal, then system default
    let currentTeamId: string | null = localStorage.getItem('currentTeamId')
    if (!currentTeamId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tm } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
        if (tm?.team_id) {
          currentTeamId = tm.team_id
          localStorage.setItem('currentTeamId', currentTeamId)
        }
      }
    }

    // 1) Team avatars (prefer a team default if any)
    let teamRows: any[] = []
    if (currentTeamId) {
      const { data: teamData } = await supabase
        .from('avatar_assets')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })
      teamRows = teamData || []
    }

    // 2) Personal avatars (user-owned)
    const { data: userData } = await supabase.auth.getUser()
    let personalRows: any[] = []
    if (userData.user) {
      const { data: me } = await supabase
        .from('avatar_assets')
        .select('*')
        .eq('created_by', userData.user.id)
        .is('team_id', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })
      personalRows = me || []
    }

    // 3) System default fallback (global)
    const { data: systemDefault } = await supabase
      .from('avatar_assets')
      .select('*')
      .is('team_id', null)
      .is('created_by', null)
      .eq('is_default', true)
      .limit(1)
    const systemRows = systemDefault || []

    const combined = [...teamRows, ...personalRows]
    if (combined.length === 0) {
      return systemRows as any
    }
    return combined as any
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
  const [effectiveDefaultBackground, setEffectiveDefaultBackground] = useState<AvatarBackground | null>(null)
  const [effectiveDefaultAvatarUrl, setEffectiveDefaultAvatarUrl] = useState<string | null>(null)

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

  // Compute effective defaults with system fallback when not present in team/personal
  useEffect(() => {
    let canceled = false
    async function computeDefaults() {
      try {
        // Default background: prefer team/personal marked as default
        const localDefaultBg = backgrounds.find(bg => bg.is_default) || null
        if (localDefaultBg) {
          if (!canceled) setEffectiveDefaultBackground(localDefaultBg)
        } else {
          // Fallback to system default background
          const { data: sysBg } = await supabase
            .from('avatar_assets')
            .select('*')
            .is('team_id', null)
            .is('created_by', null)
            .eq('type', 'color')
            .eq('name', 'system-default-background')
            .eq('is_default', true)
            .maybeSingle()
          if (!canceled) setEffectiveDefaultBackground((sysBg as any) || null)
        }

        // Default avatar persona image: prefer local image named default-avatar
        const localDefaultAvatar = backgrounds.find(bg => bg.type === 'image' && (bg.name || '').toLowerCase() === 'default-avatar')
        if (localDefaultAvatar?.value) {
          if (!canceled) setEffectiveDefaultAvatarUrl(localDefaultAvatar.value)
        } else {
          const { data: sysAvatar } = await supabase
            .from('avatar_assets')
            .select('value')
            .is('team_id', null)
            .is('created_by', null)
            .eq('type', 'image')
            .eq('name', 'default-avatar')
            .eq('is_default', true)
            .maybeSingle()
          if (!canceled) setEffectiveDefaultAvatarUrl((sysAvatar as any)?.value || null)
        }
      } catch (e) {
        if (!canceled) {
          setEffectiveDefaultBackground(null)
          setEffectiveDefaultAvatarUrl(null)
        }
      }
    }
    computeDefaults()
    return () => { canceled = true }
  }, [backgrounds])

  const createBackground = async (background: Omit<AvatarBackground, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      // If a team-scoped creation is needed, attach team_id
      const currentTeamId: string | null = localStorage.getItem('currentTeamId')
      const payload: any = { ...background, created_by: user.user.id }
      if (currentTeamId) payload.team_id = currentTeamId

      const { error } = await supabase.from('avatar_assets').insert(payload)
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
      // Reset default for the scope: team if team-owned, else user-owned
      // Determine scope of the selected asset
      const { data: asset } = await supabase
        .from('avatar_assets')
        .select('id, team_id, created_by')
        .eq('id', id)
        .maybeSingle()
      if (!asset) throw new Error('Elemento avatar non trovato')

      if ((asset as any).team_id) {
        await supabase.from('avatar_assets').update({ is_default: false }).eq('team_id', (asset as any).team_id).neq('id', id)
        const { error } = await supabase.from('avatar_assets').update({ is_default: true }).eq('id', id)
        if (error) throw error
      } else if ((asset as any).created_by) {
        await supabase.from('avatar_assets').update({ is_default: false }).eq('created_by', (asset as any).created_by).neq('id', id)
        const { error } = await supabase.from('avatar_assets').update({ is_default: true }).eq('id', id).eq('created_by', (asset as any).created_by)
        if (error) throw error
      } else {
        // Global system default should not be toggled here
        throw new Error('Non è possibile modificare il default di sistema')
      }

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

  return {
    backgrounds,
    loading,
    defaultBackground: effectiveDefaultBackground,
    defaultAvatarImageUrl: effectiveDefaultAvatarUrl,
    createBackground,
    updateBackground,
    deleteBackground,
    setAsDefaultBackground,
    uploadImage
  }
}
