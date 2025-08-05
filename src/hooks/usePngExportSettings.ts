import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface PngExportSetting {
  id: string
  name: string
  description?: string
  field_lines_color: string
  field_lines_thickness: number
  jersey_numbers_color: string
  jersey_numbers_shadow: string
  use_player_avatars: boolean
  name_box_color: string
  name_text_color: string
  avatar_background_color: string
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
          field_lines_thickness: 2,
          jersey_numbers_color: '#000000',
          jersey_numbers_shadow: '2px 2px 4px rgba(0,0,0,0.9)',
          use_player_avatars: false,
          name_box_color: '#ffffff',
          name_text_color: '#000000',
          avatar_background_color: '#1a2332',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        })
        setSettings([])
      } else {
        // Tabella esiste - carica i dati
        setTableExists(true)
        await loadSettings(true) // 🔧 FIX: Passa true per bypassare race condition
      }
    } catch (error) {
      console.error('Errore nel controllo della tabella:', error)
      // In caso di errore, usa impostazioni di default
      setDefaultSetting({
        id: 'default',
        name: 'Impostazioni Default',
        description: 'Impostazioni di default per l\'esportazione PNG',
        field_lines_color: '#ffffff',
        field_lines_thickness: 2,
        jersey_numbers_color: '#000000',
        jersey_numbers_shadow: '2px 2px 4px rgba(0,0,0,0.9)',
        use_player_avatars: false,
        name_box_color: '#ffffff',
        name_text_color: '#000000',
        avatar_background_color: '#1a2332',
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

  const loadSettings = async (forceTableExists = false) => {
    const actualTableExists = forceTableExists || tableExists
    if (!actualTableExists) {
      return
    }

          try {
        const { data, error } = await supabase
          .from('png_export_settings')
          .select('*')
          // MODIFICA: Carica TUTTE le impostazioni (utente + system default)
          .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore nel caricamento delle impostazioni:', error)
        return
      }

      // Ensure all required properties are present
      const settingsWithDefaults = (data || []).map(setting => ({
        ...setting,
        use_player_avatars: setting.use_player_avatars ?? false
      }))

      setSettings(settingsWithDefaults)

      // Trova l'impostazione di default
      const defaultData = settingsWithDefaults?.find(setting => setting.is_default)
      
      if (defaultData) {
        setDefaultSetting(defaultData)
      } else if (settingsWithDefaults && settingsWithDefaults.length > 0) {
        // Se non c'è un default esplicito, usa la prima impostazione salvata
        setDefaultSetting(settingsWithDefaults[0])
      } else {
        setDefaultSetting(null)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni:', error)
    }
  }

  const createSetting = async (settingData: {
    name: string
    description?: string
    field_lines_color: string
    field_lines_thickness: number
    jersey_numbers_color: string
    jersey_numbers_shadow: string
    use_player_avatars: boolean
    name_box_color: string
    name_text_color: string
    avatar_background_color: string
    is_default?: boolean
  }) => {
    if (!tableExists) {
      toast.error('La funzionalità di personalizzazione PNG non è ancora disponibile')
      return
    }

    try {
      // Se questa è l'impostazione di default, rimuovi il flag dalle TUTTE le altre
      if (settingData.is_default) {
        const { error: resetError } = await supabase
          .from('png_export_settings')
          .update({ is_default: false })
          // 🔧 FIX: Rimuovi da TUTTE (non solo utente), incluso sistema
        
        if (resetError) {
          console.error('Errore nel reset default:', resetError)
        }
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

      await loadSettings(true) // 🔧 FIX: Ricarica con forceTableExists
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
      // Se questa diventa l'impostazione di default, rimuovi il flag da TUTTE le altre
      if (updates.is_default) {
        const { error: resetError } = await supabase
          .from('png_export_settings')
          .update({ is_default: false })
          .neq('id', id) // Escludi solo l'impostazione corrente
          // 🔧 FIX: Rimuovi da TUTTE, incluso sistema
        
        if (resetError) {
          console.error('Errore nel reset default (updateSetting):', resetError)
        }
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

      await loadSettings(true) // 🔧 FIX: Ricarica con forceTableExists
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
      // Rimuovi il flag default da TUTTE le altre impostazioni (incluso sistema)
      const { error: resetError } = await supabase
        .from('png_export_settings')
        .update({ is_default: false })
        // 🔧 FIX: Rimuovi da TUTTE, incluso sistema
      
      if (resetError) {
        console.error('Errore nel reset default (setAsDefault):', resetError)
      }

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

      await loadSettings(true) // 🔧 FIX: Usa forceTableExists per evitare race condition
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
