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
  team_id?: string | null
}

export const useJerseyTemplates = () => {
  const [jerseyTemplates, setJerseyTemplates] = useState<JerseyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultJersey, setDefaultJersey] = useState<JerseyTemplate | null>(null)
  const [tableExists, setTableExists] = useState(false)

  useEffect(() => {
    checkTableAndLoadJerseys()
  }, [])

  // Forza un ricaricamento quando il componente viene montato
  useEffect(() => {
    if (tableExists && !loading) {
      loadJerseyTemplates()
    }
  }, [tableExists, loading])

  const checkTableAndLoadJerseys = async () => {
    try {
      // Prima verifichiamo se la tabella esiste
      const { data, error } = await supabase
        .from('jersey_templates')
        .select('count')
        .limit(1)

      if (error && error.code === '42P01') {
        // Tabella non esiste - usa jersey di default
        setTableExists(false)
        setDefaultJersey({
          id: 'default',
          name: 'Maglia Default',
          description: 'Maglia di default del sistema',
          image_url: '/assets/jersey-example.png',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        })
        setJerseyTemplates([])
      } else {
        // Tabella esiste - carica i dati
        setTableExists(true)
        await loadJerseyTemplates()
        
        // Se non ci sono maglie degli utenti, usa la maglia di sistema come fallback
        if (jerseyTemplates.length === 0) {
          const { data: systemJersey } = await supabase
            .from('jersey_templates')
            .select('*')
            .is('created_by', null)
            .eq('is_default', true)
            .maybeSingle()
          
          if (systemJersey) {
            setDefaultJersey(systemJersey)
          }
        } else if (jerseyTemplates.length > 0 && !defaultJersey) {
          // Se ci sono maglie ma nessuna è default, usa la prima
          setDefaultJersey(jerseyTemplates[0])
        }
      }
    } catch (error) {
      console.error('Errore nel controllo della tabella:', error)
      // In caso di errore, usa jersey di default
      setDefaultJersey({
        id: 'default',
        name: 'Maglia Default',
        description: 'Maglia di default del sistema',
        image_url: '/assets/jersey-example.png',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null
      })
      setJerseyTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const loadJerseyTemplates = async () => {
    if (!tableExists) return

    try {
      // Determina team corrente
      let currentTeamId = localStorage.getItem('currentTeamId')
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

      // Carica solo maglie del team corrente
      let query = supabase
        .from('jersey_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (currentTeamId) {
        query = query.eq('team_id', currentTeamId)
      } else {
        // Nessun team: nessuna maglia team-specific
        setJerseyTemplates([])
      }

      const { data, error } = await query
      if (error) throw error

      setJerseyTemplates(data || [])

      // Fallback: se non ci sono maglie del team, usa la default di sistema (created_by IS NULL AND is_default)
      if (!data || data.length === 0) {
        const { data: systemJersey } = await supabase
          .from('jersey_templates')
          .select('*')
          .is('created_by', null)
          .is('team_id', null)
          .eq('is_default', true)
          .maybeSingle()
        setDefaultJersey(systemJersey || {
          id: 'default',
          name: 'Maglia Placeholder',
          description: 'Segnaposto in assenza di template',
          image_url: '/assets/jersey-example.png',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          team_id: null
        } as any)
      } else {
        const defaultTemplate = data.find(t => t.is_default)
        setDefaultJersey(defaultTemplate || data[0] || null)
      }
      

    } catch (error) {
      console.error('Errore nel caricamento delle maglie:', error)
      toast.error('Errore nel caricamento delle maglie')
    }
  }

  const createJerseyTemplate = async (templateData: {
    name: string
    description?: string
    image_url: string
    is_default?: boolean
  }) => {
    if (!tableExists) {
      toast.error('La funzionalità maglie personalizzate non è ancora disponibile')
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Utente non autenticato')

      // Determina team corrente
      let currentTeamId = localStorage.getItem('currentTeamId')
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
      if (!currentTeamId) throw new Error('Nessun team selezionato')

      // Se è la prima maglia del team, impostala automaticamente come default
      const { data: existingJerseys } = await supabase
        .from('jersey_templates')
        .select('id')
        .eq('team_id', currentTeamId)
        .limit(1)

      const isFirstJersey = !existingJerseys || existingJerseys.length === 0
      const finalTemplateData = {
        ...templateData,
        created_by: userData.user.id,
        team_id: currentTeamId,
        is_default: isFirstJersey || templateData.is_default
      }

      // Se questa diventa default, rimuovi il flag dalle altre DEL TEAM CORRENTE
      if (finalTemplateData.is_default) {
        await supabase
          .from('jersey_templates')
          .update({ is_default: false })
          .eq('team_id', currentTeamId)
      }

      const { data, error } = await supabase
        .from('jersey_templates')
        .insert(finalTemplateData)
        .select()
        .single()

      if (error) throw error

      await loadJerseyTemplates()
      toast.success(`Maglia creata con successo${isFirstJersey ? ' e impostata come default' : ''}!`)
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
    if (!tableExists) {
      toast.error('La funzionalità maglie personalizzate non è ancora disponibile')
      return
    }

    try {
      // Se questa diventa la nuova maglia di default, rimuovi il flag da tutte le altre DEL TEAM
      if (updates.is_default) {
        // Trova team_id della maglia
        const { data: jt } = await supabase.from('jersey_templates').select('team_id').eq('id', id).maybeSingle()
        await supabase
          .from('jersey_templates')
          .update({ is_default: false })
          .neq('id', id)
          .eq('team_id', jt?.team_id || null)
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
    if (!tableExists) {
      toast.error('La funzionalità maglie personalizzate non è ancora disponibile')
      return
    }

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

  const setAsDefault = async (id: string | null) => {
    if (id === null) {
      // Rimuovi il default da tutte le maglie
      for (const jersey of jerseyTemplates) {
        if (jersey.is_default) {
          await updateJerseyTemplate(jersey.id, { is_default: false })
        }
      }
    } else {
      // Imposta una maglia come default
      await updateJerseyTemplate(id, { is_default: true })
    }
  }

  return {
    jerseyTemplates,
    defaultJersey,
    loading,
    tableExists,
    createJerseyTemplate,
    updateJerseyTemplate,
    deleteJerseyTemplate,
    uploadJerseyImage,
    setAsDefault,
    reload: checkTableAndLoadJerseys
  }
}