import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface PngExportSetting {
  id: string
  name: string
  description?: string
  field_lines_color: string
  jersey_numbers_color: string
  name_box_color: string
  name_text_color: string
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export const usePngExportSettings = () => {
  const [settings, setSettings] = useState<PngExportSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultSetting, setDefaultSetting] = useState<PngExportSetting | null>(null)
  const [tableExists, setTableExists] = useState(false)

  useEffect(() => {
    checkTableAndLoadSettings()
  }, [])

  const checkTableAndLoadSettings = async () => {
    try {
      // Verifica se la tabella esiste
      const { data, error } = await supabase
        .from('png_export_settings')
        .select('count')
        .limit(1)

      if (error && error.code === '42P01') {
        // Tabella non esiste - usa impostazioni di default
        setTableExists(false)
        setDefaultSetting({
          id: 'default',
          name: 'Impostazioni Default',
          description: 'Impostazioni di default per l\'esportazione PNG',
          field_lines_color: '#ffffff',
          jersey_numbers_color: '#000000',
          name_box_color: '#ffffff',
          name_text_color: '#000000',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        })
        setSettings([])
      } else {
        // Tabella esiste - carica i dati
        setTableExists(true)
        await loadSettings()
      }
    } catch (error) {
      console.error('Errore nel controllo della tabella:', error)
      // In caso di errore, usa impostazioni di default
      setDefaultSetting({
        id: 'default',
        name: 'Impostazioni Default',
        description: 'Impostazioni di default per l\'esportazione PNG',
        field_lines_color: '#ffffff',
        jersey_numbers_color: '#000000',
        name_box_color: '#ffffff',
        name_text_color: '#000000',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null
      })
      setSettings([])
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    if (!tableExists) return

    try {
      const { data, error } = await supabase
        .from('png_export_settings')
        .select('*')
        .not('created_by', 'is', null) // Solo impostazioni degli utenti
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore nel caricamento delle impostazioni:', error)
        return
      }

      setSettings(data || [])

      // Trova l'impostazione di default
      const defaultData = data?.find(setting => setting.is_default)
      if (defaultData) {
        setDefaultSetting(defaultData)
      } else if (data && data.length > 0) {
        // Se non c'è un default, usa la prima
        setDefaultSetting(data[0])
      }
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni:', error)
    }
  }

  const createSetting = async (settingData: {
    name: string
    description?: string
    field_lines_color: string
    jersey_numbers_color: string
    name_box_color: string
    name_text_color: string
    is_default?: boolean
  }) => {
    if (!tableExists) {
      toast.error('La funzionalità di personalizzazione PNG non è ancora disponibile')
      return
    }

    try {
      // Se questa è l'impostazione di default, rimuovi il flag dalle altre
      if (settingData.is_default) {
        await supabase
          .from('png_export_settings')
          .update({ is_default: false })
          .not('created_by', 'is', null)
      }

      const { data, error } = await supabase
        .from('png_export_settings')
        .insert([{
          ...settingData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Errore nella creazione:', error)
        toast.error('Errore nella creazione delle impostazioni')
        return
      }

      await loadSettings()
      toast.success('Impostazioni create con successo!')
      return data
    } catch (error) {
      console.error('Errore nella creazione:', error)
      toast.error('Errore nella creazione delle impostazioni')
    }
  }

  const updateSetting = async (
    id: string, 
    updates: Partial<Omit<PngExportSetting, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
  ) => {
    if (!tableExists) return

    try {
      // Se questa diventa l'impostazione di default, rimuovi il flag dalle altre
      if (updates.is_default) {
        await supabase
          .from('png_export_settings')
          .update({ is_default: false })
          .not('created_by', 'is', null)
          .neq('id', id)
      }

      const { error } = await supabase
        .from('png_export_settings')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Errore nell\'aggiornamento:', error)
        toast.error('Errore nell\'aggiornamento delle impostazioni')
        return
      }

      await loadSettings()
      toast.success('Impostazioni aggiornate con successo!')
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
      toast.error('Errore nell\'aggiornamento delle impostazioni')
    }
  }

  const deleteSetting = async (id: string) => {
    if (!tableExists) return

    try {
      const { error } = await supabase
        .from('png_export_settings')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Errore nell\'eliminazione:', error)
        toast.error('Errore nell\'eliminazione delle impostazioni')
        return
      }

      await loadSettings()
      toast.success('Impostazioni eliminate con successo!')
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error)
      toast.error('Errore nell\'eliminazione delle impostazioni')
    }
  }

  const setAsDefault = async (id: string) => {
    if (!tableExists) return

    try {
      // Rimuovi il flag default da tutte le altre impostazioni
      await supabase
        .from('png_export_settings')
        .update({ is_default: false })
        .not('created_by', 'is', null)

      // Imposta questa come default
      const { error } = await supabase
        .from('png_export_settings')
        .update({ is_default: true })
        .eq('id', id)

      if (error) {
        console.error('Errore nell\'impostazione del default:', error)
        toast.error('Errore nell\'impostazione del default')
        return
      }

      await loadSettings()
      toast.success('Impostazioni impostate come default!')
    } catch (error) {
      console.error('Errore nell\'impostazione del default:', error)
      toast.error('Errore nell\'impostazione del default')
    }
  }

  return {
    settings,
    defaultSetting,
    loading,
    tableExists,
    createSetting,
    updateSetting,
    deleteSetting,
    setAsDefault,
    loadSettings
  }
}