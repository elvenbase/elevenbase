import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Loader2, Clock, MapPin, Calendar, CheckCircle, XCircle, Users, Target, Download } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useCustomFormations } from '@/hooks/useCustomFormations'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import FormationExporter from '@/components/FormationExporter'
import html2canvas from 'html2canvas'
import { useRoles } from '@/hooks/useRoles'
import { normalizeRoleCodeFrom } from '@/utils/roleNormalization'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  avatar_url?: string
}

interface Trialist { id: string; first_name: string; last_name: string; avatar_url?: string; status?: string; self_registered?: boolean }

type SelectEntity = `player:${string}` | `trialist:${string}`

interface Session {
  id: string
  title: string
  description?: string
  session_date: string
  start_time: string
  end_time: string
  location?: string
  teams?: {
    id: string
    name: string
    logo_url?: string
    primary_color?: string
    secondary_color?: string
  }
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

interface LineupPlayer {
  player_id: string
  position_x: number
  position_y: number
  player?: Player
}

interface Formation {
  name: string
  positions: Array<{ x: number; y: number }>
}

const PublicSession = () => {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [trialistsInvited, setTrialistsInvited] = useState<Trialist[]>([])
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([])
  const [selectedEntity, setSelectedEntity] = useState<SelectEntity | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'present' | 'absent'>('present')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [lineup, setLineup] = useState<Lineup | null>(null)
  const [convocati, setConvocati] = useState<any[]>([])
  const { formations: customFormations } = useCustomFormations()
  const { defaultJersey } = useJerseyTemplates()
  const { data: roles = [] } = useRoles()
  const roleMap = new Map<string, { label: string; abbreviation: string }>(roles.map(r => [r.code, { label: r.label, abbreviation: r.abbreviation }]))


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
      // Use fetch directly to handle HTTP errors better
      const response = await fetch(`https://cuthalxqxkonmfzqjdvw.supabase.co/functions/v1/public-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({ token, method: 'GET' })
      })

      const data = await response.json()


      if (!response.ok) {
        setError(data.error || `Errore HTTP ${response.status}`)
        return
      }

      if (data.error) {
        console.error('Data error:', data.error)
        setError(data.error)
        return
      }

      setSession(data.session)
      setPlayers(data.players)
      setTrialistsInvited(data.trialistsInvited || [])
      setExistingAttendance(data.existingAttendance)
      
      if (data.convocati) {

        setConvocati(data.convocati)
      }
      
      // Usare la stessa logica dell'admin: se allow_responses_until è impostato, usarla.
      // Altrimenti fallback a 2 ore prima dell'inizio.
      let registrationDeadline: Date
      if (data.session.allow_responses_until) {
        registrationDeadline = new Date(data.session.allow_responses_until)
      } else {
        const sessionDateTime = new Date(`${data.session.session_date}T${data.session.start_time}`)
        registrationDeadline = new Date(sessionDateTime.getTime() - (2 * 60 * 60 * 1000))
      }
      setDeadline(registrationDeadline)

      if (data.session?.id) {
        await loadLineup(data.session.id)
        // Fallback: se i provinanti non hanno status nello payload della funzione edge, recuperali direttamente da Supabase
        try {
          const missingStatus = !Array.isArray(data.trialistsInvited) || (data.trialistsInvited || []).some((t: any) => typeof t.status === 'undefined')
          if (missingStatus) {
            const { data: tiRows, error: tiErr } = await supabase
              .from('training_trialist_invites')
              .select('trialist_id, status, self_registered')
              .eq('session_id', data.session.id)
            if (!tiErr && Array.isArray(tiRows)) {
              const map = new Map<string, { status?: string; self_registered?: boolean }>()
              tiRows.forEach((r: any) => map.set(r.trialist_id, { status: r.status, self_registered: r.self_registered }))
              setTrialistsInvited((prev) => (prev || []).map((t: any) => ({ ...t, ...map.get(t.id) })))
            }
          }
        } catch (e) {
          console.warn('Fallback trialist status fetch failed:', e)
        }

        // Fallback: carica convocati direttamente dal DB se la funzione edge non li ha forniti
        if (!Array.isArray(data.convocati)) {
          try {
            const { data: convRows, error: convErr } = await supabase
              .from('training_convocati')
              .select('id, player_id')
              .eq('session_id', data.session.id)

            if (!convErr && Array.isArray(convRows)) {
              const convWithPlayers = convRows.map((row: any) => ({
                ...row,
                players: (players || []).find(p => p.id === row.player_id) || null
              }))
              setConvocati(convWithPlayers)
            }
          } catch (e) {
            console.warn('Fallback convocati fetch failed:', e)
          }
        }
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
    if (!selectedEntity) {
      toast.error('Seleziona il tuo nome')
      return
    }

    setSubmitting(true)

    try {
      const [kind, id] = selectedEntity.split(':') as ['player' | 'trialist', string]
      const statusToSave = selectedStatus === 'pending' ? 'present' : selectedStatus
      const payload: any = { token, status: statusToSave }
      if (kind === 'player') payload.playerId = id
      if (kind === 'trialist') payload.trialistId = id

      const resp = await fetch(`https://cuthalxqxkonmfzqjdvw.supabase.co/functions/v1/public-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabase.supabaseKey}` },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (!resp.ok) {
        toast.error(data?.error || `HTTP ${resp.status}`)
        return
      }
      if (data?.error) {
        toast.error(data.error)
        return
      }

      toast.success('Registrazione completata con successo!')
      
      await loadSessionData()
      setSelectedEntity('')
      setSelectedStatus('present')

    } catch (err: any) {
      console.error('Errore nella registrazione:', err)
      toast.error('Errore nella registrazione')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadFormation = async () => {
    if (!lineup || !getFormationFromLineup(lineup.formation)) {
      toast.error('Nessuna formazione disponibile per il download')
      return
    }

    try {
      const exportElement = document.getElementById('formation-export')
      if (!exportElement) {
        toast.error('Errore nel preparare l\'immagine')
        return
      }

      toast.loading('Generando immagine...')
      
      // Forza il refresh dell'elemento
      exportElement.style.display = 'none'
      void exportElement.offsetHeight // Trigger reflow
      exportElement.style.display = 'block'
      
      // Piccolo delay per assicurarsi che il DOM sia aggiornato
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(exportElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      // Create download link
      const link = document.createElement('a')
      const timestamp = new Date().getTime()
      link.download = `formazione-${session?.title?.replace(/\s+/g, '-').toLowerCase() || 'sessione'}-${timestamp}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.dismiss()
      toast.success('Formazione scaricata con successo!')
    } catch (error) {
      console.error('Error downloading formation:', error)
      toast.dismiss()
      toast.error('Errore nel scaricare la formazione')
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



  // Formazioni predefinite
  const predefinedFormations: Record<string, { name: string; positions: { id: string; name: string; x: number; y: number; roleShort?: string }[] }> = {
    '4-4-2': {
      name: '4-4-2',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 90, roleShort: 'P' },
        { id: 'rb', name: 'Terzino Dx', x: 80, y: 70, roleShort: 'TD' },
        { id: 'cb1', name: 'Centrale 1', x: 60, y: 70, roleShort: 'DC' },
        { id: 'cb2', name: 'Centrale 2', x: 40, y: 70, roleShort: 'DC' },
        { id: 'lb', name: 'Terzino Sx', x: 20, y: 70, roleShort: 'TS' },
        { id: 'rm', name: 'Esterno Dx', x: 80, y: 40, roleShort: 'ED' },
        { id: 'cm1', name: 'Mediano 1', x: 60, y: 40, roleShort: 'MC' },
        { id: 'cm2', name: 'Mediano 2', x: 40, y: 40, roleShort: 'MC' },
        { id: 'lm', name: 'Esterno Sx', x: 20, y: 40, roleShort: 'ES' },
        { id: 'st1', name: 'Attaccante 1', x: 60, y: 15, roleShort: 'ATT' },
        { id: 'st2', name: 'Attaccante 2', x: 40, y: 15, roleShort: 'ATT' }
      ]
    },
    '4-3-3': {
      name: '4-3-3',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 90, roleShort: 'P' },
        { id: 'rb', name: 'Terzino Dx', x: 80, y: 70, roleShort: 'TD' },
        { id: 'cb1', name: 'Centrale 1', x: 60, y: 70, roleShort: 'DC' },
        { id: 'cb2', name: 'Centrale 2', x: 40, y: 70, roleShort: 'DC' },
        { id: 'lb', name: 'Terzino Sx', x: 20, y: 70, roleShort: 'TS' },
        { id: 'cdm', name: 'Mediano', x: 50, y: 50, roleShort: 'MED' },
        { id: 'cm1', name: 'Mezzala Dx', x: 65, y: 40, roleShort: 'MD' },
        { id: 'cm2', name: 'Mezzala Sx', x: 35, y: 40, roleShort: 'MS' },
        { id: 'rw', name: 'Ala Dx', x: 80, y: 20, roleShort: 'AD' },
        { id: 'st', name: 'Punta', x: 50, y: 15, roleShort: 'PU' },
        { id: 'lw', name: 'Ala Sx', x: 20, y: 20, roleShort: 'AS' }
      ]
    },
    '3-5-2': {
      name: '3-5-2',
      positions: [
        { id: 'gk', name: 'Portiere', x: 50, y: 90, roleShort: 'P' },
        { id: 'cb1', name: 'Centrale Dx', x: 70, y: 70, roleShort: 'DCD' },
        { id: 'cb2', name: 'Centrale', x: 50, y: 70, roleShort: 'DC' },
        { id: 'cb3', name: 'Centrale Sx', x: 30, y: 70, roleShort: 'DCS' },
        { id: 'rwb', name: 'Quinto Dx', x: 85, y: 50, roleShort: 'QD' },
        { id: 'cm1', name: 'Mediano 1', x: 65, y: 40, roleShort: 'MC' },
        { id: 'cm2', name: 'Regista', x: 50, y: 45, roleShort: 'REG' },
        { id: 'cm3', name: 'Mediano 2', x: 35, y: 40, roleShort: 'MC' },
        { id: 'lwb', name: 'Quinto Sx', x: 15, y: 50, roleShort: 'QS' },
        { id: 'st1', name: 'Attaccante 1', x: 60, y: 15, roleShort: 'ATT' },
        { id: 'st2', name: 'Attaccante 2', x: 40, y: 15, roleShort: 'ATT' }
      ]
    }
  }

  // Combina formazioni predefinite e personalizzate
  const getAllFormations = () => {
    const formations = { ...predefinedFormations }
    
    // Aggiungi formazioni custom
    customFormations.forEach(customFormation => {
      formations[customFormation.name] = {
        name: customFormation.name,
        positions: customFormation.positions
      }
    })
    
    return formations
  }

  const formations = getAllFormations()

  // Funzione per ottenere la formazione dal lineup (che può essere ID o nome)
  const getFormationFromLineup = (formationIdentifier: string) => {
    // Prima prova a cercare per ID nelle formazioni custom
    const customFormation = customFormations.find(f => f.id === formationIdentifier)
    if (customFormation) {
      return {
        name: customFormation.name,
        positions: customFormation.positions
      }
    }
    
    // Poi prova a cercare per nome nelle formazioni (predefinite + custom)
    return formations[formationIdentifier] || null
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
    const isSessionClosed = error.includes('chiusa') || error.includes('Chiusa')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {isSessionClosed ? 'Sessione Chiusa' : 'Errore'}
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
  const assignedCount = lineup ? (((getFormationFromLineup(lineup.formation)?.positions) || []).filter(position => lineup.players_data?.positions?.[position.id]).length) : 0
  const hasFullEleven = assignedCount >= 11

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Team Header */}
        {session?.teams && (
          <div className="text-center border-b border-border/20">
            <div className="flex items-center justify-center gap-4 mb-2">
              {session.teams.logo_url && (
                <img
                  src={session.teams.logo_url}
                  alt={`Logo ${session.teams.name}`}
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: session.teams.primary_color || undefined }}>
                {session.teams.name}
              </h2>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center py-[15px]">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Registrazione Allenamento</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Conferma la tua presenza per la sessione</p>
        </div>

        {/* Session Info */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span className="break-words">{session.title}</span>
            </CardTitle>
            {session.description && (
              <CardDescription className="text-sm sm:text-base">{session.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-3 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4 sm:space-y-0">
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="break-words">{formatSessionDateTime(session.session_date, session.start_time)}</span>
              </div>
              
              {session.location && (
                <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="break-words">{session.location}</span>
                </div>
              )}
            </div>

            {deadline && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <span className="font-medium text-sm sm:text-base">
                  {isExpired ? 'Registrazioni chiuse' : 'Tempo per registrarsi (chiude 4h prima):'}
                </span>
                <Badge variant={isExpired ? "destructive" : "default"} className="text-xs sm:text-sm px-2 sm:px-3 py-1 self-start sm:self-center">
                  {isExpired ? 'Tempo scaduto' : timeLeft}
                </Badge>
                <div className="text-[11px] text-muted-foreground mt-1 sm:mt-0 sm:ml-3">
                  {(() => {
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
                    const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })
                    const dlStr = deadline.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
                    return `Ora attuale: ${nowStr} • Scadenza: ${dlStr} (${tz})`
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrazione (fino alla scadenza) */}
        {!isExpired ? (
          <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                Conferma la tua presenza
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Seleziona il tuo nome (giocatore o provinante) e indica se sarai presente all'allenamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Giocatore o Provinante</label>
                  <Select value={selectedEntity} onValueChange={(v: SelectEntity) => setSelectedEntity(v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleziona il tuo nome" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.length > 0 && (<div className="px-2 py-1 text-xs text-muted-foreground">Giocatori</div>)}
                      {players.map(player => {
                        const registration = getPlayerRegistration(player.id)
                        return (
                          <SelectItem key={player.id} value={`player:${player.id}` as SelectEntity} disabled={!!registration}>
                            <div className="flex items-center gap-3 w-full">
                              <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="sm" />
                              <span className="font-medium">{player.first_name} {player.last_name}</span>
                              {registration && (
                                <Badge variant="default" className="ml-auto text-xs">
                                  Ha votato
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                      {trialistsInvited.length > 0 && (<div className="px-2 py-1 text-xs text-muted-foreground">Provinanti</div>)}
                      {trialistsInvited.map(t => (
                        <SelectItem key={t.id} value={`trialist:${t.id}` as SelectEntity} disabled={t.status === 'present' || t.status === 'absent'}>
                          <div className="flex items-center gap-3 w-full">
                            <PlayerAvatar firstName={t.first_name} lastName={t.last_name} size="sm" />
                            <span className="font-medium">{t.first_name} {t.last_name}</span>
                            {t.self_registered && (
                              <Badge variant="default" className="ml-auto text-xs">
                                Ha votato
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Stato</label>
                  <Select value={selectedStatus} onValueChange={(v: 'pending' | 'present' | 'absent') => setSelectedStatus(v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleziona lo stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Presente</SelectItem>
                      <SelectItem value="absent">Assente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrati'
                  )}
                </Button>
              </CardContent>
          </Card>
        ) : (
          <div className="p-3 sm:p-4 bg-muted/50 rounded-lg flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Registrazioni chiuse</span>
            </div>
            {deadline && (
              <span className="text-xs sm:text-sm text-muted-foreground">(chiusura: {deadline.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Convocati: sopra la Formazione */}
        {convocati.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4" />
                Convocati ({convocati.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {convocati.map((convocato) => {
                  const person = convocato.players || convocato.trialists
                  if (!person) return null
                  const isTrialist = !!convocato.trialist_id && !convocato.players
                  const firstName = person.first_name || ''
                  const lastName = person.last_name || ''
                  const avatarUrl = person.avatar_url
                  const jerseyNumber = convocato.players?.jersey_number
                  return (
                    <div
                      key={convocato.id}
                      className="flex flex-col items-center p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <PlayerAvatar
                        entityId={`player:${person.id || ''}`}
                        firstName={firstName}
                        lastName={lastName}
                        avatarUrl={avatarUrl}
                        size="md"
                        className="mb-2"
                      />
                      <div className="text-center">
                        <p className="text-xs font-medium leading-tight">
                          {firstName}
                        </p>
                        <p className="text-xs font-medium leading-tight">
                          {lastName}
                        </p>
                        {jerseyNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            #{jerseyNumber}
                          </p>
                        )}
                        {isTrialist && (
                          <p className="text-[10px] text-muted-foreground mt-1">provinante</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formazione (sotto) */}
        {lineup && hasFullEleven && (
          <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="break-words">Formazione - {getFormationFromLineup(lineup.formation)?.name || lineup.formation}</span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardDescription className="text-sm sm:text-base">
                    La formazione ufficiale per questa sessione di allenamento
                  </CardDescription>
                  <Button 
                    onClick={downloadFormation} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 self-start sm:self-center"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Scarica PNG</span>
                    <span className="sm:hidden">Scarica</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
                {/* Campo da calcio - più compatto */}
                <div className="lg:col-span-2">
                  <div 
                    className="relative bg-gradient-to-b from-green-100 to-green-200 border-2 border-white rounded-lg shadow-lg overflow-hidden mx-auto" 
                    style={{ 
                      aspectRatio: '2/3', 
                      maxWidth: '350px',
                      width: '100%',
                      height: 'auto',
                      minHeight: '400px',
                      maxHeight: '500px'
                    }}
                  >
                    {/* Sfondo erba con pattern */}
                    <div 
                      className="absolute inset-0 opacity-20" 
                      style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,100,0,0.1) 5px, rgba(0,100,0,0.1) 10px)'
                      }}
                    />
                    
                    {/* Linee del campo - semplificate */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white transform -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full" />
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-l-2 border-r-2 border-b-2 border-white" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-l-2 border-r-2 border-t-2 border-white" />
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/4 h-1/12 border-l-2 border-r-2 border-b-2 border-white" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-1/12 border-l-2 border-r-2 border-t-2 border-white" />
                    
                    {/* Posizioni giocatori - con fallback trialist */}
                    {getFormationFromLineup(lineup.formation)?.positions.map(position => {
                      const pid = lineup.players_data?.positions?.[position.id]
                      const person: any = pid ? (players.find(p => p.id === pid) || trialistsInvited.find(t => t.id === pid)) : null
                      const firstName = person?.first_name || ''
                      const lastName = person?.last_name || ''
                      const avatarUrl = person?.avatar_url
                      return (
                        <div
                          key={position.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                          style={{ left: `${position.x}%`, top: `${position.y}%` }}
                          title={(() => {
                            const code = normalizeRoleCodeFrom(position);
                            const rm = roleMap.get(code);
                            const label = rm?.label || position.roleShort || position.name;
                            return person ? `${firstName} ${lastName} - ${label}` : label;
                          })()}
                        >
                          {person ? (
                            <div className="relative">
                              <PlayerAvatar
                                entityId={`player:${person?.id || ''}`}
                                firstName={firstName}
                                lastName={lastName}
                                avatarUrl={avatarUrl}
                                size="lg"
                                className="border-3 border-white shadow-lg hover:scale-110 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full border-3 border-dashed border-white bg-white/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-white/70" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Lista giocatori organizzata per ruoli (classificazione euristica) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Titolari ({getFormationFromLineup(lineup.formation)?.positions
                      .filter(position => lineup.players_data?.positions?.[position.id]).length || 0})
                  </h3>
                  {(() => {
                    const classifySector = (position: any): 'Portiere' | 'Difesa' | 'Centrocampo' | 'Attacco' | 'Altri' => {
                      const code = (position.role_code || '').toString().toUpperCase()
                      if (code === 'P') return 'Portiere'
                      if (['TD','DC','DCD','DCS','TS'].includes(code)) return 'Difesa'
                      if (['MC','MED','REG','MD','MS','ED','ES','QD','QS'].includes(code)) return 'Centrocampo'
                      if (['PU','ATT','AD','AS'].includes(code)) return 'Attacco'
                      return 'Altri'
                    }
                    const positions = getFormationFromLineup(lineup.formation)?.positions || []
                    const assigned = positions.filter((p: any) => lineup.players_data?.positions?.[p.id])
                    const grouped: Record<string, any[]> = { Portiere: [], Difesa: [], Centrocampo: [], Attacco: [], Altri: [] }
                    assigned.forEach((p: any) => { grouped[classifySector(p)].push(p) })
                    const order = [
                      { name: 'Portiere', color: 'bg-yellow-500' },
                      { name: 'Difesa', color: 'bg-blue-500' },
                      { name: 'Centrocampo', color: 'bg-green-500' },
                      { name: 'Attacco', color: 'bg-red-500' },
                      { name: 'Altri', color: 'bg-gray-500' }
                    ] as const
                    return order.map(sec => {
                      const list = grouped[sec.name]
                      if (!list || list.length === 0) return null
                      return (
                        <div key={sec.name} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${sec.color}`} />
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{sec.name}</h4>
                          </div>
                          <div className="space-y-1 pl-5">
                            {list.map((position: any) => {
                              const pid = lineup.players_data?.positions?.[position.id]
                              const person: any = players.find(p => p.id === pid) || trialistsInvited.find(t => t.id === pid)
                              if (!person) return null
                              const firstName = person.first_name || ''
                              const lastName = person.last_name || ''
                              const avatarUrl = person.avatar_url
                              return (
                                <div key={position.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                                  <PlayerAvatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size="sm" className="border-2 border-white" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{firstName} {lastName}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      {(() => {
                                        const code = normalizeRoleCodeFrom(position);
                                        const rm = roleMap.get(code);
                                        const label = rm?.label || (position as any).role || position.name;
                                        const abbr = rm?.abbreviation || position.roleShort;
                                        return <span className="font-medium">{label}{abbr ? ` (${abbr})` : ''}</span>;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
         
        
      </div>
    </div>
  )
}

export default PublicSession