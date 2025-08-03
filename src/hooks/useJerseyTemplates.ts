import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface JerseyTemplate {
  id: string
  name: string
  description?: string
  image_url: string
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export const useJerseyTemplates = () => {
  const [jerseyTemplates, setJerseyTemplates] = useState<JerseyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultJersey, setDefaultJersey] = useState<JerseyTemplate | null>(null)

  useEffect(() => {
    loadJerseyTemplates()
  }, [])

  const loadJerseyTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('jersey_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setJerseyTemplates(data || [])
      
      // Trova la maglia di default
      const defaultTemplate = data?.find(template => template.is_default)
      setDefaultJersey(defaultTemplate || null)
    } catch (error) {
      console.error('Errore nel caricamento delle maglie:', error)
      toast.error('Errore nel caricamento delle maglie')
    } finally {
      setLoading(false)
    }
  }

  const createJerseyTemplate = async (templateData: {
    name: string
    description?: string
    image_url: string
    is_default?: boolean
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Utente non autenticato')

      // Se questa è la nuova maglia di default, rimuovi il flag da tutte le altre
      if (templateData.is_default) {
        await supabase
          .from('jersey_templates')
          .update({ is_default: false })
          .neq('id', '')
      }

      const { data, error } = await supabase
        .from('jersey_templates')
        .insert({
          ...templateData,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error

      await loadJerseyTemplates()
      toast.success('Maglia creata con successo!')
      return data
    } catch (error) {
      console.error('Errore nella creazione della maglia:', error)
      toast.error('Errore nella creazione della maglia')
      throw error
    }
  }

  const updateJerseyTemplate = async (
    id: string, 
    updates: Partial<Omit<JerseyTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
  ) => {
    try {
      // Se questa diventa la nuova maglia di default, rimuovi il flag da tutte le altre
      if (updates.is_default) {
        await supabase
          .from('jersey_templates')
          .update({ is_default: false })
          .neq('id', id)
      }

      const { data, error } = await supabase
        .from('jersey_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await loadJerseyTemplates()
      toast.success('Maglia aggiornata con successo!')
      return data
    } catch (error) {
      console.error('Errore nell\'aggiornamento della maglia:', error)
      toast.error('Errore nell\'aggiornamento della maglia')
      throw error
    }
  }

  const deleteJerseyTemplate = async (id: string) => {
    try {
      // Verifica se è la maglia di default
      const template = jerseyTemplates.find(t => t.id === id)
      if (template?.is_default) {
        toast.error('Non puoi eliminare la maglia di default')
        return
      }

      const { error } = await supabase
        .from('jersey_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadJerseyTemplates()
      toast.success('Maglia eliminata con successo!')
    } catch (error) {
      console.error('Errore nell\'eliminazione della maglia:', error)
      toast.error('Errore nell\'eliminazione della maglia')
      throw error
    }
  }

  const uploadJerseyImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `jersey_${Date.now()}.${fileExt}`
      const filePath = `jerseys/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('jerseys')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('jerseys')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Errore nell\'upload dell\'immagine:', error)
      toast.error('Errore nell\'upload dell\'immagine')
      throw error
    }
  }

  const setAsDefault = async (id: string) => {
    await updateJerseyTemplate(id, { is_default: true })
  }

  return {
    jerseyTemplates,
    defaultJersey,
    loading,
    createJerseyTemplate,
    updateJerseyTemplate,
    deleteJerseyTemplate,
    uploadJerseyImage,
    setAsDefault,
    reload: loadJerseyTemplates
  }
}