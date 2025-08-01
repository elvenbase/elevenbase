import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Clock, MapPin, Calendar, CheckCircle, XCircle, Users, Target } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  avatar_url?: string
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

interface Lineup {
  formation: string
  players_data: any
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
  const [lineup, setLineup] = useState<Lineup | null>(null)

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

      // Carica anche la formazione se disponibile
      if (data.session?.id) {
        await loadLineup(data.session.id)
      }
    } catch (err: any) {
      console.error('Errore nel caricamento:', err)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const loadLineup = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('training_lineups')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (error) {
        console.error('Errore nel caricare la formazione:', error)
        return
      }
      
      if (data) {
        setLineup({
          formation: data.formation,
          players_data: data.players_data
        })
      }
    } catch (error) {
      console.error('Errore nel caricare la formazione:', error)
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

  const getPlayerInitials = (player: Player) => {
    return `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`
  }

  const getAvatarColor = (name: string) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const formations: Record<string, { name: string; positions: { id: string; name: string; x: number; y: number }[] }> = {
    '4-4-2': {
      name: '4-4-2',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 95 },
        { id: 'lb', name: 'TD', x: 15, y: 75 },
        { id: 'cb1', name: 'DC', x: 35, y: 75 },
        { id: 'cb2', name: 'DC', x: 65, y: 75 },
        { id: 'rb', name: 'DD', x: 85, y: 75 },
        { id: 'lm', name: 'ES', x: 15, y: 45 },
        { id: 'cm1', name: 'CC', x: 35, y: 45 },
        { id: 'cm2', name: 'CC', x: 65, y: 45 },
        { id: 'rm', name: 'ED', x: 85, y: 45 },
        { id: 'st1', name: 'AT', x: 35, y: 15 },
        { id: 'st2', name: 'AT', x: 65, y: 15 }
      ]
    },
    '4-3-3': {
      name: '4-3-3',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 95 },
        { id: 'lb', name: 'TD', x: 15, y: 75 },
        { id: 'cb1', name: 'DC', x: 35, y: 75 },
        { id: 'cb2', name: 'DC', x: 65, y: 75 },
        { id: 'rb', name: 'DD', x: 85, y: 75 },
        { id: 'cm1', name: 'CC', x: 25, y: 50 },
        { id: 'cm2', name: 'CC', x: 50, y: 50 },
        { id: 'cm3', name: 'CC', x: 75, y: 50 },
        { id: 'lw', name: 'AS', x: 20, y: 15 },
        { id: 'st', name: 'AT', x: 50, y: 15 },
        { id: 'rw', name: 'AD', x: 80, y: 15 }
      ]
    },
    '3-5-2': {
      name: '3-5-2',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 95 },
        { id: 'cb1', name: 'DC', x: 25, y: 75 },
        { id: 'cb2', name: 'DC', x: 50, y: 75 },
        { id: 'cb3', name: 'DC', x: 75, y: 75 },
        { id: 'lwb', name: 'ES', x: 10, y: 50 },
        { id: 'cm1', name: 'CC', x: 30, y: 50 },
        { id: 'cm2', name: 'CC', x: 50, y: 50 },
        { id: 'cm3', name: 'CC', x: 70, y: 50 },
        { id: 'rwb', name: 'ED', x: 90, y: 50 },
        { id: 'st1', name: 'AT', x: 40, y: 15 },
        { id: 'st2', name: 'AT', x: 60, y: 15 }
      ]
    },
    '5-3-2': {
      name: '5-3-2',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 95 },
        { id: 'lwb', name: 'ES', x: 10, y: 75 },
        { id: 'cb1', name: 'DC', x: 30, y: 80 },
        { id: 'cb2', name: 'DC', x: 50, y: 80 },
        { id: 'cb3', name: 'DC', x: 70, y: 80 },
        { id: 'rwb', name: 'ED', x: 90, y: 75 },
        { id: 'cm1', name: 'CC', x: 30, y: 45 },
        { id: 'cm2', name: 'CC', x: 50, y: 45 },
        { id: 'cm3', name: 'CC', x: 70, y: 45 },
        { id: 'st1', name: 'AT', x: 40, y: 15 },
        { id: 'st2', name: 'AT', x: 60, y: 15 }
      ]
    }
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

        {/* Formazione */}
        {lineup && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Formazione - {lineup.formation}
              </CardTitle>
              <CardDescription>
                La formazione ufficiale per questa sessione di allenamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gradient-to-b from-green-400 to-green-600 rounded-lg p-6 aspect-[2/3] min-h-[500px]">
                {/* Campo da calcio sfondo */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-400 to-green-600 rounded-lg opacity-90"></div>
                <div className="absolute inset-4 border-2 border-white/60 rounded"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-16 border-2 border-white/60 border-b-0 rounded-t"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-16 border-2 border-white/60 border-t-0 rounded-b"></div>
                <div className="absolute top-1/2 left-4 right-4 h-px bg-white/60"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/60 rounded-full"></div>

                {/* Posizioni giocatori */}
                {formations[lineup.formation]?.positions.map(position => {
                  const playerId = lineup.players_data?.positions?.[position.id]
                  const player = playerId ? players.find(p => p.id === playerId) : null
                  
                  return (
                    <div
                      key={position.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`
                      }}
                    >
                      <div className="relative">
                        {player ? (
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                              <AvatarImage src={player.avatar_url || undefined} />
                              <AvatarFallback 
                                className="text-white text-xs font-bold"
                                style={{ backgroundColor: getAvatarColor(player.first_name + player.last_name) }}
                              >
                                {getPlayerInitials(player)}
                              </AvatarFallback>
                            </Avatar>
                            {player.jersey_number && (
                              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow">
                                {player.jersey_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border-3 border-dashed border-white bg-white/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white/70" />
                          </div>
                        )}
                        <div className="text-xs text-white font-medium px-2 py-1 bg-black/50 rounded backdrop-blur-sm">
                          {position.name}
                        </div>
                        {player && (
                          <div className="text-xs text-white/90 text-center px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm max-w-24 truncate">
                            {player.first_name} {player.last_name.charAt(0)}.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

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