import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
}

interface Session {
  id: string
  title: string
  description?: string
  session_date: string
  start_time: string
  end_time: string
  location?: string
}

interface AttendanceRecord {
  player_id: string
  status: string
  self_registered: boolean
}

const PublicRegistration = () => {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'absent'>('present')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setError('Token mancante')
      setLoading(false)
      return
    }

    loadSessionData()
  }, [token])

  // Countdown timer
  useEffect(() => {
    if (!deadline) return

    const timer = setInterval(() => {
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Tempo scaduto')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      setTimeLeft(`${hours}h ${minutes}m`)
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline])

  const loadSessionData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('public-registration', {
        body: { token, method: 'GET' }
      })

      if (error) throw error

      if (data.error) {
        setError(data.error)
        return
      }

      setSession(data.session)
      setPlayers(data.players)
      setExistingAttendance(data.existingAttendance)
      setDeadline(new Date(data.deadline))
    } catch (err: any) {
      console.error('Errore nel caricamento:', err)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      toast.error('Seleziona un giocatore')
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke('public-registration', {
        body: {
          token,
          playerId: selectedPlayer,
          status: selectedStatus
        }
      })

      if (error) throw error

      if (data.error) {
        toast.error(data.error)
        return
      }

      toast.success('Registrazione completata con successo!')
      
      // Ricarica i dati per mostrare l'aggiornamento
      await loadSessionData()
      setSelectedPlayer('')
      setSelectedStatus('present')

    } catch (err: any) {
      console.error('Errore nella registrazione:', err)
      toast.error('Errore nella registrazione')
    } finally {
      setSubmitting(false)
    }
  }

  const getPlayerRegistration = (playerId: string) => {
    return existingAttendance.find(a => a.player_id === playerId)
  }

  const formatSessionDateTime = (date: string, time: string) => {
    const sessionDate = new Date(date + 'T' + time)
    return format(sessionDate, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Errore</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/not-found" replace />
  }

  const isExpired = deadline && new Date() > deadline

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {session.title}
            </CardTitle>
            <CardDescription>{session.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {formatSessionDateTime(session.session_date, session.start_time)}
            </div>
            
            {session.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {session.location}
              </div>
            )}

            {deadline && (
              <div className="flex items-center gap-2">
                <Badge variant={isExpired ? "destructive" : "secondary"}>
                  {isExpired ? 'Tempo scaduto' : `Tempo rimasto: ${timeLeft}`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrazione */}
        {!isExpired && (
          <Card>
            <CardHeader>
              <CardTitle>Conferma la tua presenza</CardTitle>
              <CardDescription>
                Seleziona il tuo nome e indica se sarai presente all'allenamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Giocatore</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tuo nome" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => {
                      const registration = getPlayerRegistration(player.id)
                      return (
                        <SelectItem 
                          key={player.id} 
                          value={player.id}
                          disabled={!!registration}
                        >
                          <div className="flex items-center gap-2">
                            {player.first_name} {player.last_name}
                            {player.jersey_number && (
                              <Badge variant="outline">#{player.jersey_number}</Badge>
                            )}
                            {registration && (
                              <Badge 
                                variant={registration.status === 'present' ? "default" : "secondary"}
                                className="ml-2"
                              >
                                {registration.status === 'present' ? 'Presente' : 'Assente'}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Presenza</label>
                <Select value={selectedStatus} onValueChange={(value: 'present' | 'absent') => setSelectedStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Sarò presente
                      </div>
                    </SelectItem>
                    <SelectItem value="absent">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Non sarò presente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !selectedPlayer}
                className="w-full"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conferma Registrazione
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Riepilogo registrazioni */}
        <Card>
          <CardHeader>
            <CardTitle>Riepilogo Registrazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {existingAttendance.filter(a => a.status === 'present').length}
                </div>
                <div className="text-sm text-muted-foreground">Presenti</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {existingAttendance.filter(a => a.status === 'absent').length}
                </div>
                <div className="text-sm text-muted-foreground">Assenti</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {players.length - existingAttendance.length}
                </div>
                <div className="text-sm text-muted-foreground">Non risposto</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PublicRegistration