import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppSettings } from '@/hooks/useAppSettings'
import { Settings, Save, MessageCircle, Shield, Database } from 'lucide-react'

export const AppSettingsManager: React.FC = () => {
  const { settings, loading, isAdmin, updateSetting, getSetting } = useAppSettings()
  const [localSettings, setLocalSettings] = useState({
    whatsapp_group_code: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading) {
      setLocalSettings({
        whatsapp_group_code: getSetting('whatsapp_group_code', '')
      })
    }
  }, [settings, loading, getSetting])

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      await updateSetting(
        'whatsapp_group_code',
        localSettings.whatsapp_group_code,
        'Codice del gruppo WhatsApp per gli inviti automatici',
        true
      )
    } catch (error) {
      console.error('Error saving app settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateGroupCode = (code: string) => {
    // Verifica che sia un codice gruppo WhatsApp valido
    return code.length > 10 && /^[a-zA-Z0-9]+$/.test(code)
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">Caricamento impostazioni...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Impostazioni App
          <div className="flex gap-2 ml-auto">
            <Badge variant={isAdmin ? "default" : "secondary"} className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {isAdmin ? 'Admin' : 'Utente'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Database
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Configura le impostazioni generali dell'applicazione salvate nel database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <div className="p-4 bg-muted/50 rounded-lg border border-amber-200">
            <p className="text-sm text-muted-foreground">
              ⚠️ Solo gli amministratori possono modificare le impostazioni dell'app.
              Le impostazioni vengono caricate dal database.
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-code" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Codice Gruppo WhatsApp
            </Label>
            <div className="space-y-2">
              <Input
                id="whatsapp-code"
                placeholder="Inserisci il codice del gruppo (es. ABC123XYZ456)"
                value={localSettings.whatsapp_group_code}
                onChange={(e) => handleInputChange('whatsapp_group_code', e.target.value)}
                className="font-mono"
                disabled={!isAdmin}
              />
              <p className="text-sm text-muted-foreground">
                Il codice si trova nel link di invito del gruppo: 
                <code className="bg-muted px-1 rounded text-xs ml-1">
                  https://chat.whatsapp.com/<strong>ABC123XYZ456</strong>
                </code>
              </p>
              {localSettings.whatsapp_group_code && !validateGroupCode(localSettings.whatsapp_group_code) && (
                <p className="text-sm text-destructive">
                  ⚠️ Il codice inserito potrebbe non essere valido
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveSettings} 
            disabled={saving || !isAdmin}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}