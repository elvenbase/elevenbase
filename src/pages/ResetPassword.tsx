import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mode, setMode] = useState<'request'|'update'>('request')

  useEffect(() => {
    // If a recovery token is present in URL, switch to update mode
    const type = searchParams.get('type')
    const token = searchParams.get('token')
    if (type === 'recovery' && token) {
      setMode('update')
    }
  }, [searchParams])

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
      // When opened from recovery link, Supabase stores session; update directly
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password aggiornata, effettua il login')
      navigate('/auth')
    } catch (e: any) {
      toast.error(e.message || 'Errore aggiornamento password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'request' ? 'Recupero password' : 'Imposta nuova password'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'request' ? (
            <>
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <Button className="w-full" onClick={sendResetEmail}>Invia email di reset</Button>
            </>
          ) : (
            <>
              <Input type="password" placeholder="Nuova password" value={password} onChange={e => setPassword(e.target.value)} />
              <Input type="password" placeholder="Conferma password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              <Button className="w-full" onClick={updatePassword}>Aggiorna password</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPassword