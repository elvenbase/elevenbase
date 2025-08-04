import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AvatarBackground {
  id: string
  name: string
  type: 'color' | 'image'
  value: string
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export const useAvatarBackgrounds = () => {
  const [backgrounds, setBackgrounds] = useState<AvatarBackground[]>([])
  const [loading, setLoading] = useState(true)

  const loadBackgrounds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('avatar_backgrounds')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error

      // Type assertion per gestire il tipo string che arriva dal database
      const typedData = (data || []).map(item => ({
        ...item,
        type: item.type as 'color' | 'image'
      })) as AvatarBackground[]

      setBackgrounds(typedData)
    } catch (error) {
      console.error('Error loading avatar backgrounds:', error)
      toast.error('Impossibile caricare gli sfondi avatar')
    } finally {
      setLoading(false)
    }
  }

  const createBackground = async (background: Omit<AvatarBackground, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('avatar_backgrounds')
        .insert({
          ...background,
          created_by: user.user.id
        })

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo avatar creato con successo')
    } catch (error) {
      console.error('Error creating background:', error)
      toast.error('Errore nella creazione dello sfondo')
    }
  }

  const updateBackground = async (id: string, updates: Partial<Pick<AvatarBackground, 'name' | 'type' | 'value'>>) => {
    try {
      const { error } = await supabase
        .from('avatar_backgrounds')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo aggiornato con successo')
    } catch (error) {
      console.error('Error updating background:', error)
      toast.error('Errore nell\'aggiornamento dello sfondo')
    }
  }

  const deleteBackground = async (id: string) => {
    try {
      const { error } = await supabase
        .from('avatar_backgrounds')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo eliminato con successo')
    } catch (error) {
      console.error('Error deleting background:', error)
      toast.error('Errore nell\'eliminazione dello sfondo')
    }
  }

  const setAsDefaultBackground = async (id: string) => {
    try {
      // Reset all to non-default
      await supabase
        .from('avatar_backgrounds')
        .update({ is_default: false })
        .neq('id', id)

      // Set selected as default
      const { error } = await supabase
        .from('avatar_backgrounds')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo predefinito aggiornato')
    } catch (error) {
      console.error('Error setting default background:', error)
      toast.error('Errore nell\'impostazione dello sfondo predefinito')
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-bg-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Errore nel caricamento dell\'immagine')
    }
  }

  useEffect(() => {
    loadBackgrounds()
  }, [])

  return {
    backgrounds,
    loading,
    createBackground,
    updateBackground,
    deleteBackground,
    setAsDefaultBackground,
    uploadImage
  }
}
