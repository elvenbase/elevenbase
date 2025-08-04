
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AvatarBackground {
  id: string;
  name: string;
  type: 'color' | 'image';
  value: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useAvatarBackgrounds = () => {
  const [backgrounds, setBackgrounds] = useState<AvatarBackground[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBackgrounds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('avatar_backgrounds')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBackgrounds(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error loading avatar backgrounds:', err)
      setError(err.message)
      toast.error('Errore nel caricamento degli sfondi avatar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBackgrounds()
  }, [])

  const createBackground = async (data: Partial<AvatarBackground>) => {
    try {
      const { data: result, error } = await supabase
        .from('avatar_backgrounds')
        .insert([{
          name: data.name!,
          type: data.type!,
          value: data.value!,
          is_default: data.is_default || false
        }])
        .select()
        .single()

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo avatar creato con successo!')
      return result
    } catch (err: any) {
      console.error('Error creating background:', err)
      toast.error('Errore nella creazione dello sfondo')
      throw err
    }
  }

  const updateBackground = async (id: string, data: Partial<AvatarBackground>) => {
    try {
      // Se questo diventa il nuovo default, rimuovi il flag da tutti gli altri
      if (data.is_default) {
        await supabase
          .from('avatar_backgrounds')
          .update({ is_default: false })
          .neq('id', id)
      }

      const { data: result, error } = await supabase
        .from('avatar_backgrounds')
        .update({
          name: data.name,
          type: data.type,
          value: data.value,
          is_default: data.is_default
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo avatar aggiornato con successo!')
      return result
    } catch (err: any) {
      console.error('Error updating background:', err)
      toast.error('Errore nell\'aggiornamento dello sfondo')
      throw err
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
      toast.success('Sfondo avatar eliminato con successo!')
    } catch (err: any) {
      console.error('Error deleting background:', err)
      toast.error('Errore nell\'eliminazione dello sfondo')
      throw err
    }
  }

  const setAsDefaultBackground = async (id: string) => {
    try {
      // Rimuovi il default da tutti gli altri
      await supabase
        .from('avatar_backgrounds')
        .update({ is_default: false })
        .neq('id', id)

      // Imposta questo come default
      const { error } = await supabase
        .from('avatar_backgrounds')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      await loadBackgrounds()
      toast.success('Sfondo predefinito aggiornato!')
    } catch (err: any) {
      console.error('Error setting default background:', err)
      toast.error('Errore nell\'impostazione del default')
      throw err
    }
  }

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatar-backgrounds/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      toast.error('Errore nel caricamento dell\'immagine')
      throw err
    }
  }

  const defaultBackground = backgrounds.find(bg => bg.is_default) || backgrounds[0] || null

  return {
    backgrounds,
    defaultBackground,
    loading,
    error,
    createBackground,
    updateBackground,
    deleteBackground,
    setAsDefaultBackground,
    uploadImage,
    reload: loadBackgrounds
  };
};
