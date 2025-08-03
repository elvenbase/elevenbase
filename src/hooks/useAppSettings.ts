import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AppSetting {
  id: string
  setting_key: string
  setting_value: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export const useAppSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkUserRole()
    loadSettings()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        return
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id)

      const hasAdminRole = roles?.some(role => role.role_name === 'admin')
      setIsAdmin(!!hasAdminRole)
    } catch (error) {
      console.error('Error checking user role:', error)
      setIsAdmin(false)
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Carica le impostazioni pubbliche o tutte se admin
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('setting_key')

      if (error) {
        if (error.code === '42P01') {
          // Tabella non esiste ancora
          console.log('App settings table does not exist yet')
          setSettings({})
          return
        }
        throw error
      }

      // Converte l'array in un oggetto chiave-valore
      const settingsMap = (data || []).reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      }, {} as Record<string, string>)

      setSettings(settingsMap)
    } catch (error) {
      console.error('Error loading app settings:', error)
      // Fallback su localStorage se il database non è disponibile
      const localCode = localStorage.getItem('whatsapp_group_code') || ''
      setSettings({ whatsapp_group_code: localCode })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: string, description?: string, isPublic: boolean = true) => {
    if (!isAdmin) {
      toast({
        title: "Errore",
        description: "Solo gli amministratori possono modificare le impostazioni",
        variant: "destructive"
      })
      return false
    }

    try {
      // Usa la funzione upsert_app_setting
      const { data, error } = await supabase
        .rpc('upsert_app_setting', {
          p_setting_key: key,
          p_setting_value: value,
          p_description: description,
          p_is_public: isPublic
        })

      if (error) throw error

      // Aggiorna lo stato locale
      setSettings(prev => ({
        ...prev,
        [key]: value
      }))

      // Aggiorna anche localStorage come backup
      localStorage.setItem(key, value)

      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni sono state salvate con successo"
      })

      return true
    } catch (error) {
      console.error('Error updating app setting:', error)
      
      // Fallback su localStorage se il database fallisce
      localStorage.setItem(key, value)
      setSettings(prev => ({
        ...prev,
        [key]: value
      }))

      toast({
        title: "Salvato localmente",
        description: "Impostazioni salvate in locale. Alcuni utenti potrebbero non vederle.",
        variant: "default"
      })

      return false
    }
  }

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || localStorage.getItem(key) || defaultValue
  }

  const getWhatsAppGroupCode = (): string => {
    return getSetting('whatsapp_group_code', '')
  }

  return {
    settings,
    loading,
    isAdmin,
    updateSetting,
    getSetting,
    getWhatsAppGroupCode,
    loadSettings
  }
}