import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AvatarBackground {
  id: string
  name: string
  type: 'color' | 'image'
  value: string // hex color or image URL
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export const useAvatarBackgrounds = () => {
  const [backgrounds, setBackgrounds] = useState<AvatarBackground[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultBackground, setDefaultBackground] = useState<AvatarBackground | null>(null)
  const { toast } = useToast()

  const loadBackgrounds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('avatar_backgrounds')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, create it
          await createTable()
          setBackgrounds([])
          setDefaultBackground(null)
        } else {
          throw error
        }
      } else {
        setBackgrounds(data || [])
        const defaultBg = data?.find(bg => bg.is_default)
        setDefaultBackground(defaultBg || null)
      }
    } catch (error) {
      console.error('Error loading avatar backgrounds:', error)
      toast({
        title: "Errore",
        description: "Impossibile caricare gli sfondi avatar",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createTable = async () => {
    try {
      const { error } = await supabase.rpc('create_avatar_backgrounds_table')
      if (error) {
        console.error('Error creating avatar backgrounds table:', error)
        toast({
          title: "Errore",
          description: "Impossibile creare la tabella per gli sfondi avatar",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating avatar backgrounds table:', error)
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

      toast({
        title: "Successo",
        description: "Sfondo avatar creato con successo"
      })

      await loadBackgrounds()
    } catch (error) {
      console.error('Error creating avatar background:', error)
      toast({
        title: "Errore",
        description: "Impossibile creare lo sfondo avatar",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateBackground = async (id: string, updates: Partial<AvatarBackground>) => {
    try {
      const { error } = await supabase
        .from('avatar_backgrounds')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Sfondo avatar aggiornato con successo"
      })

      await loadBackgrounds()
    } catch (error) {
      console.error('Error updating avatar background:', error)
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo sfondo avatar",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteBackground = async (id: string) => {
    try {
      const { error } = await supabase
        .from('avatar_backgrounds')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Sfondo avatar eliminato con successo"
      })

      await loadBackgrounds()
    } catch (error) {
      console.error('Error deleting avatar background:', error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare lo sfondo avatar",
        variant: "destructive"
      })
      throw error
    }
  }

  const setAsDefaultBackground = async (id: string) => {
    try {
      // Remove default from all backgrounds
      await supabase
        .from('avatar_backgrounds')
        .update({ is_default: false })

      // Set new default
      const { error } = await supabase
        .from('avatar_backgrounds')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Sfondo predefinito aggiornato"
      })

      await loadBackgrounds()
    } catch (error) {
      console.error('Error setting default avatar background:', error)
      toast({
        title: "Errore",
        description: "Impossibile impostare lo sfondo predefinito",
        variant: "destructive"
      })
      throw error
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatar-backgrounds/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar background image:', error)
      throw new Error('Impossibile caricare l\'immagine')
    }
  }

  useEffect(() => {
    loadBackgrounds()
  }, [])

  return {
    backgrounds,
    defaultBackground,
    loading,
    loadBackgrounds,
    createBackground,
    updateBackground,
    deleteBackground,
    setAsDefaultBackground,
    uploadImage
  }
}