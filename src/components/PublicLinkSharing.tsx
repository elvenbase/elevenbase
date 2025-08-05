import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Copy, ExternalLink, Clock, Users, CheckCircle, XCircle, Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppInviteBox } from './WhatsAppInviteBox'
import { useUpdateTrainingSession } from '@/hooks/useSupabaseData'

interface Session {
  id: string
  title: string
  public_link_token?: string
  allow_responses_until?: string
  session_date: string
  start_time: string
  is_closed: boolean
}

interface AttendanceStats {
  present: number
  absent: number
  noResponse: number
  totalPlayers: number
}

interface PublicLinkSharingProps {
  session: Session
  attendanceStats: AttendanceStats
  onRefresh?: () => void
}

const PublicLinkSharing = ({ session, attendanceStats, onRefresh }: PublicLinkSharingProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [isEditingDeadline, setIsEditingDeadline] = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const updateSession = useUpdateTrainingSession()
  
  const sessionUrl = session.public_link_token 
    ? `${window.location.origin}/session/${session.public_link_token}`
    : ''
  
  console.log('Session URL generated:', sessionUrl)
  console.log('Session token:', session.public_link_token)

  // Countdown timer
  useEffect(() => {
    if (!session.allow_responses_until) return

    const timer = setInterval(() => {
      const now = new Date()
      const deadline = new Date(session.allow_responses_until!)
      const diff = deadline.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Tempo scaduto')
        setIsExpired(true)
        return
      }

      setIsExpired(false)
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      setTimeLeft(`${hours}h ${minutes}m`)
    }, 1000)

    return () => clearInterval(timer)
  }, [session.allow_responses_until])

  const copyToClipboard = async () => {
    if (!sessionUrl) return

    try {
      await navigator.clipboard.writeText(sessionUrl)
      toast.success('Link copiato negli appunti!')
    } catch (error) {
      toast.error('Errore nel copiare il link')
    }
  }

  const openPublicLink = () => {
    if (sessionUrl) {
      console.log('Opening URL:', sessionUrl)
      window.open(sessionUrl, '_blank')
    }
  }

  // Gestione modifica deadline autoregistrazione
  const startEditingDeadline = () => {
    if (session.is_closed) {
      toast.error('Non è possibile modificare una sessione chiusa')
      return
    }
    
    // Imposta il valore attuale come default
    if (session.allow_responses_until) {
      const deadline = new Date(session.allow_responses_until)
      // Formato per datetime-local input: YYYY-MM-DDTHH:mm
      const formatted = deadline.toISOString().slice(0, 16)
      setNewDeadline(formatted)
    } else {
      // Default: 2 ore prima dell'allenamento
      const sessionStart = new Date(session.session_date + 'T' + session.start_time)
      sessionStart.setHours(sessionStart.getHours() - 2)
      const formatted = sessionStart.toISOString().slice(0, 16)
      setNewDeadline(formatted)
    }
    setIsEditingDeadline(true)
  }

  const saveDeadline = async () => {
    if (!newDeadline) {
      toast.error('Seleziona una data e ora valida')
      return
    }

    try {
      await updateSession.mutateAsync({
        id: session.id,
        data: { allow_responses_until: newDeadline }
      })
      
      toast.success('Scadenza autoregistrazione aggiornata')
      setIsEditingDeadline(false)
      onRefresh?.()
    } catch (error) {
      console.error('Errore aggiornamento deadline:', error)
      toast.error('Errore nel salvare la scadenza')
    }
  }

  const cancelEditingDeadline = () => {
    setIsEditingDeadline(false)
    setNewDeadline('')
  }

  if (!session.public_link_token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link Pubblico</CardTitle>
          <CardDescription>
            Link pubblico non disponibile per questa sessione
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const responseRate = attendanceStats.totalPlayers > 0 
    ? Math.round(((attendanceStats.present + attendanceStats.absent) / attendanceStats.totalPlayers) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Link Pubblico di Registrazione
        </CardTitle>
        <CardDescription>
          Condividi questo link per permettere ai giocatori di registrarsi autonomamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status e timing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Scadenza registrazioni</span>
              {!session.is_closed && !isEditingDeadline && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEditingDeadline}
                  className="h-6 w-6 p-0 ml-1"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
            {isEditingDeadline ? (
              <div className="space-y-2">
                <Input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="text-xs"
                />
                <div className="flex gap-1 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveDeadline}
                    disabled={updateSession.isPending}
                    className="h-7 px-2"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditingDeadline}
                    className="h-7 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Badge variant={isExpired ? "destructive" : "secondary"} className="text-sm">
                {timeLeft || 'Non impostato'}
              </Badge>
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Tasso di risposta</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {responseRate}%
            </Badge>
          </div>
        </div>

        {/* Statistiche presenze in tempo reale */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Presenti</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {attendanceStats.present}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Assenti</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {attendanceStats.absent}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Non risposto</span>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">
              {attendanceStats.noResponse}
            </div>
          </div>
        </div>

        {/* Link copiabile */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Link di registrazione</label>
          <div className="flex gap-2">
            <Input value={sessionUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={openPublicLink}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* WhatsApp Invite Box */}
        <div className="mt-4">
          <WhatsAppInviteBox 
            sessionTitle={session.title}
            publicLink={sessionUrl}
          />
        </div>

        {/* Pulsante di aggiornamento */}
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            Aggiorna Statistiche
          </Button>
        )}

        {/* Stato sessione e modificabilità */}
        {session.is_closed && (
          <div className="p-4 bg-muted/30 border rounded-lg">
            <p className="text-sm text-muted-foreground font-medium">
              🔒 Sessione chiusa - Le impostazioni autoregistrazione non sono più modificabili
            </p>
          </div>
        )}

        {/* Avviso scadenza */}
        {isExpired && !session.is_closed && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Il tempo per le registrazioni è scaduto. Le nuove registrazioni non sono più accettate.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Puoi modificare la scadenza cliccando l'icona di modifica sopra.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PublicLinkSharing