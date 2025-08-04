
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AdminSetupProps {
  onSetupComplete: () => void
}

export const AdminSetup: React.FC<AdminSetupProps> = ({ onSetupComplete }) => {
  const [setupToken, setSetupToken] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [hasActiveSetup, setHasActiveSetup] = useState(false)

  // Dichiara la funzione prima di usarla
  const checkAdminSetup = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_setup')
        .select('*')
        .eq('is_completed', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    } catch (error) {
      console.error('Error checking admin setup:', error)
      return false
    }
  }

  useEffect(() => {
    const initializeSetup = async () => {
      setInitializing(true)
      
      const hasSetup = await checkAdminSetup()
      setHasActiveSetup(hasSetup)
      
      if (!hasSetup) {
        try {
          const { data, error } = await supabase.rpc('initialize_admin_setup')
          
          if (error) throw error
          
          setSetupToken(data)
        } catch (error) {
          console.error('Error initializing admin setup:', error)
          toast.error('Errore nell\'inizializzazione del setup amministratore')
        }
      }
      
      setInitializing(false)
    }

    initializeSetup()
  }, [])

  const handleCompleteSetup = async () => {
    if (!setupToken.trim()) {
      toast.error('Inserisci il token di setup')
      return
    }

    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('complete_admin_setup', {
        _setup_token: setupToken,
        _user_id: user.user.id
      })

      if (error) throw error

      if (data) {
        toast.success('Setup amministratore completato con successo!')
        onSetupComplete()
      } else {
        toast.error('Token di setup non valido o scaduto')
      }
    } catch (error) {
      console.error('Error completing admin setup:', error)
      toast.error('Errore nel completamento del setup')
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Inizializzazione in corso...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasActiveSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle>Setup già in corso</CardTitle>
            <CardDescription>
              È già presente un setup amministratore attivo. Contatta il supporto se hai bisogno di assistenza.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Setup Amministratore</CardTitle>
          <CardDescription>
            Completa il setup per diventare amministratore del sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Il tuo token di setup è stato generato automaticamente. 
              Copia e incolla il token qui sotto per completare il setup.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="setup-token">Token di Setup</Label>
            <Input
              id="setup-token"
              placeholder="Inserisci il token di setup"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Il token viene fornito durante l'installazione del sistema
            </p>
          </div>

          <Button 
            onClick={handleCompleteSetup} 
            disabled={loading || !setupToken.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completamento in corso...
              </>
            ) : (
              'Completa Setup'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
