import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, MapPin, Calendar, CheckCircle, XCircle, Users } from 'lucide-react'
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

const PublicSession = () => {
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
    console.log('Loading session data for token:', token)
    try {
      const { data, error } = await supabase.functions.invoke('public-registration', {
        body: { token, method: 'GET' }
      })

      console.log('Edge function response:', { data, error })

      if (error) throw error

      if (data.error) {
        console.error('Data error:', data.error)
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
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Caricamento sessione...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Errore
            </CardTitle>
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">Registrazione Allenamento</h1>
          <p className="text-muted-foreground">Conferma la tua presenza per la sessione</p>
        </div>

        {/* Session Info */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Calendar className="h-6 w-6 text-primary" />
              {session.title}
            </CardTitle>
            {session.description && (
              <CardDescription className="text-base">{session.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span>{formatSessionDateTime(session.session_date, session.start_time)}</span>
              </div>
              
              {session.location && (
                <div className="flex items-center gap-3 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{session.location}</span>
                </div>
              )}
            </div>

            {deadline && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-medium">Tempo per registrarsi:</span>
                <Badge variant={isExpired ? "destructive" : "default"} className="text-sm px-3 py-1">
                  {isExpired ? 'Tempo scaduto' : timeLeft}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Registrazione */}
          {!isExpired && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Conferma la tua presenza
                </CardTitle>
                <CardDescription>
                  Seleziona il tuo nome e indica se sarai presente all'allenamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Giocatore</label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="h-12">
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
                            <div className="flex items-center gap-3 w-full">
                              <span className="font-medium">
                                {player.first_name} {player.last_name}
                              </span>
                              {player.jersey_number && (
                                <Badge variant="outline" className="text-xs">
                                  #{player.jersey_number}
                                </Badge>
                              )}
                              {registration && (
                                <Badge 
                                  variant={registration.status === 'present' ? "default" : "secondary"}
                                  className="ml-auto text-xs"
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

                <div className="space-y-3">
                  <label className="text-sm font-medium">Presenza</label>
                  <Select value={selectedStatus} onValueChange={(value: 'present' | 'absent') => setSelectedStatus(value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Sarò presente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="absent">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span>Non sarò presente</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting || !selectedPlayer}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Conferma Registrazione
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Riepilogo registrazioni */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Riepilogo Registrazioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {existingAttendance.filter(a => a.status === 'present').length}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Presenti</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-600">
                    {existingAttendance.filter(a => a.status === 'absent').length}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Assenti</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {players.length - existingAttendance.length}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Non risposto</div>
                </div>
              </div>

              {/* Lista giocatori registrati */}
              {existingAttendance.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Risposte ricevute
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {existingAttendance.map(attendance => {
                      const player = players.find(p => p.id === attendance.player_id)
                      if (!player) return null
                      
                      return (
                        <div key={attendance.player_id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm">
                            {player.first_name} {player.last_name}
                            {player.jersey_number && ` (#${player.jersey_number})`}
                          </span>
                          <Badge 
                            variant={attendance.status === 'present' ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {attendance.status === 'present' ? 'Presente' : 'Assente'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isExpired && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-destructive mb-2">Registrazioni Chiuse</h3>
                <p className="text-muted-foreground">
                  Il tempo per registrarsi a questa sessione è scaduto.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default PublicSession