import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SiteLogo } from '@/components/SiteLogo'
import { toast } from 'sonner'

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mode, setMode] = useState<'request'|'update'>('request')

  useEffect(() => {
    // Detect recovery via query (?type=recovery&token=...) or hash (#access_token=...&type=recovery)
    const typeQ = searchParams.get('type')
    const hash = (location.hash || '').replace(/^#/, '')
    const hashParams = new URLSearchParams(hash)
    const typeH = hashParams.get('type')
    if (typeQ === 'recovery' || typeH === 'recovery' || hashParams.get('access_token')) {
      setMode('update')
    }
  }, [searchParams, location.hash])

  const sendResetEmail = async () => {
    try {
      if (!email) return toast.error('Inserisci la tua email')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      toast.success('Email per reset inviata (controlla la posta)')
    } catch (e: any) {
      toast.error(e.message || 'Errore richiesta reset')
    }
  }

  const updatePassword = async () => {
    try {
      if (!password || password !== confirm) return toast.error('Le password non coincidono')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password aggiornata, effettua il login')
      navigate('/auth')
    } catch (e: any) {
      toast.error(e.message || 'Errore aggiornamento password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <SiteLogo 
            className="h-24 w-auto mx-auto"
            alt="Logo ElevenBase"
            fallbackSrc="/assets/IMG_0055.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo_elevenBase.png' }}
          />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{mode === 'request' ? 'Recupero password' : 'Imposta nuova password'}</CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'request' ? (
            <>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="w-full" onClick={sendResetEmail}>Invia email di reset</Button>
            </>
          ) : (
            <>
              <Input type="password" placeholder="Nuova password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input type="password" placeholder="Conferma password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button className="w-full" onClick={updatePassword}>Aggiorna password</Button>
            </>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword