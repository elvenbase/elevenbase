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
  team_id?: string | null
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
      const { data, error } = await supabase
        .from('png_export_settings')
        .select('count')
        .limit(1)

      if (error && (error as any).code === '42P01') {
        setTableExists(false)
        setDefaultSetting(defaultDefaults())
        setSettings([])
      } else {
        setTableExists(true)
        await loadSettings(true)
      }
    } catch (error) {
      console.error('Errore nel controllo della tabella:', error)
      setDefaultSetting(defaultDefaults())
      setSettings([])
    } finally {
      setLoading(false)
    }
  }

  const resolveCurrentTeamId = async (): Promise<string | null> => {
    let currentTeamId = localStorage.getItem('currentTeamId')
    if (currentTeamId) return currentTeamId
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
        return currentTeamId
      }
    }
    return null
  }

  const loadSettings = async (forceTableExists = false) => {
    const actualTableExists = forceTableExists || tableExists
    if (!actualTableExists) return

    try {
      const currentTeamId = await resolveCurrentTeamId()
      const { data, error } = await supabase
        .from('png_export_settings')
        .select('*')
        // Carica default globali (is_default=true, team_id NULL) o quelle del team corrente
        .or(`is_default.eq.true,team_id.eq.${currentTeamId || 'null'}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Errore nel caricamento delle impostazioni:', error)
        return
      }

      const settingsWithDefaults = (data || []).map(setting => ({
        ...setting,
        use_player_avatars: (setting as any).use_player_avatars ?? false
      })) as PngExportSetting[]

      setSettings(settingsWithDefaults)

      const defaultData = settingsWithDefaults.find(s => s.is_default)
      if (defaultData) {
        setDefaultSetting(defaultData)
      } else if (settingsWithDefaults.length > 0) {
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
      // Se impostata default per team: rimuovi il flag default dalle impostazioni del medesimo team
      if (settingData.is_default) {
        const currentTeamId = await resolveCurrentTeamId()
        const { error: resetError } = await supabase
          .from('png_export_settings')
          .update({ is_default: false })
          .eq('team_id', currentTeamId)
        if (resetError) {
          console.error('Errore nel reset default team:', resetError)
        }
      }

      const currentTeamId = await resolveCurrentTeamId()
      const { data, error } = await supabase
        .from('png_export_settings')
        .insert([{
          ...settingData,
          team_id: currentTeamId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Errore nella creazione:', error)
        toast.error('Errore nella creazione delle impostazioni')
        return
      }

      await loadSettings(true)
      toast.success('Impostazioni create con successo!')
      return data
    } catch (error) {
      console.error('Errore nella creazione delle impostazioni:', error)
      toast.error('Errore nella creazione delle impostazioni')
    }
  }

  const updateSetting = async (
    id: string, 
    updates: Partial<Omit<PngExportSetting, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
  ) => {
    if (!tableExists) return

    try {
      if (updates.is_default) {
        const currentTeamId = await resolveCurrentTeamId()
        const { error: resetError } = await supabase
          .from('png_export_settings')
          .update({ is_default: false })
          .eq('team_id', currentTeamId)
          .neq('id', id)
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

      await loadSettings(true)
      toast.success('Impostazioni aggiornate con successo!')
    } catch (error) {
      console.error('Errore nell\'aggiornamento delle impostazioni:', error)
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

      await loadSettings(true)
      toast.success('Impostazioni eliminate con successo!')
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error)
      toast.error('Errore nell\'eliminazione delle impostazioni')
    }
  }

  const setAsDefault = async (id: string) => {
    if (!tableExists) return

    try {
      const currentTeamId = await resolveCurrentTeamId()
      const { error: resetError } = await supabase
        .from('png_export_settings')
        .update({ is_default: false })
        .eq('team_id', currentTeamId)
      if (resetError) {
        console.error('Errore nel reset default (setAsDefault):', resetError)
      }

      const { error } = await supabase
        .from('png_export_settings')
        .update({ is_default: true })
        .eq('id', id)

      if (error) {
        console.error('Errore nell\'impostazione del default:', error)
        toast.error('Errore nell\'impostazione del default')
        return
      }

      await loadSettings(true)
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

function defaultDefaults(): PngExportSetting {
  return {
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
    created_by: null,
    team_id: null,
  }
}