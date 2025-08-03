import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings, Save, MessageCircle } from 'lucide-react'

interface AppSettings {
  whatsapp_group_code: string
}

export const AppSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    whatsapp_group_code: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Carica dalle localStorage per ora, poi potremmo spostare su Supabase
    const savedCode = localStorage.getItem('whatsapp_group_code') || ''
    setSettings({
      whatsapp_group_code: savedCode
    })
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      
      // Salva in localStorage per ora
      localStorage.setItem('whatsapp_group_code', settings.whatsapp_group_code)
      
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni dell'app sono state salvate con successo"
      })
    } catch (error) {
      console.error('Error saving app settings:', error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateGroupCode = (code: string) => {
    // Verifica che sia un codice gruppo WhatsApp valido
    return code.length > 10 && /^[a-zA-Z0-9]+$/.test(code)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Impostazioni App
        </CardTitle>
        <CardDescription>
          Configura le impostazioni generali dell'applicazione
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                value={settings.whatsapp_group_code}
                onChange={(e) => handleInputChange('whatsapp_group_code', e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Il codice si trova nel link di invito del gruppo: 
                <code className="bg-muted px-1 rounded text-xs ml-1">
                  https://chat.whatsapp.com/<strong>ABC123XYZ456</strong>
                </code>
              </p>
              {settings.whatsapp_group_code && !validateGroupCode(settings.whatsapp_group_code) && (
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
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}