import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Clock, CheckCircle, XCircle, MapPin, Users, Target, Download } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { useCustomFormations } from '@/hooks/useCustomFormations'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import FormationExporter from '@/components/FormationExporter'
import html2canvas from 'html2canvas'

interface Player { id: string; first_name: string; last_name: string; jersey_number?: number }
interface Trialist { id: string; first_name: string; last_name: string; status?: string; self_registered?: boolean }
interface MatchInfo { id: string; opponent_name: string; match_date: string; match_time: string; location?: string }
interface AttendanceRecord { player_id: string; status: string; self_registered: boolean }

type SelectEntity = `player:${string}` | `trialist:${string}`

const MatchPublicRegistration = () => {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [trialistsInvited, setTrialistsInvited] = useState<Trialist[]>([])
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([])
  const [selectedEntity, setSelectedEntity] = useState<SelectEntity | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'present' | 'absent'>('present')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [lineup, setLineup] = useState<any | null>(null)
  const [score, setScore] = useState<{ us: number; opp: number }>({ us: 0, opp: 0 })
  const [bench, setBench] = useState<any[]>([])
  const { formations: customFormations } = useCustomFormations()
  const { defaultJersey } = useJerseyTemplates()

  useEffect(() => { if (!token) { setError('Token mancante'); setLoading(false); return } loadData() }, [token])

  useEffect(() => {
    if (!deadline) return
    const timer = setInterval(() => {
      const now = new Date(); const diff = deadline.getTime() - now.getTime()
      if (diff <= 0) { setTimeLeft('Tempo scaduto'); return }
      const hours = Math.floor(diff / (1000 * 60 * 60)); const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${hours}h ${minutes}m`)
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const loadData = async () => {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/public-match-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabase.supabaseKey}` },
        body: JSON.stringify({ token, method: 'GET' })
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || `HTTP ${response.status}`); return }
      if (data.error) { setError(data.error); return }
      
      // Debug per verificare i dati caricati
      console.log('Dati caricati:', {
        match: data.match,
        players: data.players?.length,
        trialistsInvited: data.trialistsInvited?.length,
        existingAttendance: data.existingAttendance?.length
      })
      

      
      setMatch(data.match)
      setPlayers(data.players)
      setTrialistsInvited(data.trialistsInvited || [])
      setExistingAttendance(data.existingAttendance)
      setDeadline(new Date(data.deadline))
      setLineup(data.lineup || [])
      setBench(data.bench || [])

      // Calcolo punteggio opzionale
      try {
        const { data: events } = await supabase
          .from('match_events')
          .select('event_type, team')
          .eq('match_id', data.match.id)
        if (Array.isArray(events)) {
          let us = 0, opp = 0
          for (const e of events as any[]) {
            if (e.event_type === 'goal') { e.team === 'us' ? us++ : opp++ }
            if (e.event_type === 'own_goal') { e.team === 'us' ? opp++ : us++ }
            if (e.event_type === 'pen_scored') { e.team === 'us' ? us++ : opp++ }
          }
          setScore({ us, opp })
        }
      } catch { /* ignore */ }
    } catch (err: any) {
      console.error('Errore nel caricamento:', err)
      setError('Errore nel caricamento dei dati')
    } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    if (!selectedEntity) { toast.error('Seleziona il tuo nome'); return }
    setSubmitting(true)
    try {
      const [kind, id] = selectedEntity.split(':') as ['player' | 'trialist', string]
      // Normalizza: se pending, salviamo come 'present' o 'absent'? Manteniamo pending per coerenza con training
      const statusToSave = selectedStatus === 'pending' ? 'present' : selectedStatus
      const payload: any = { token, status: statusToSave }
      if (kind === 'player') payload.playerId = id
      if (kind === 'trialist') payload.trialistId = id
      const resp = await fetch(`${supabase.supabaseUrl}/functions/v1/public-match-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabase.supabaseKey}` },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (!resp.ok) { toast.error(data?.error || `HTTP ${resp.status}`); return }
      if (data.error) { toast.error(data.error); return }
      toast.success('Registrazione completata!')
      console.log('Registrazione completata, ricarico dati...')
      await loadData()
      console.log('Dati ricaricati dopo registrazione')
      setSelectedEntity(''); setSelectedStatus('present')
    } catch (err: any) {
      console.error('Errore nella registrazione:', err)
      toast.error('Errore nella registrazione')
    } finally { setSubmitting(false) }
  }

  const getPlayerRegistration = (playerId: string) => existingAttendance.find(a => a.player_id === playerId)
  
  const getTrialistRegistration = (trialistId: string) => {
    const trialist = trialistsInvited.find(t => t.id === trialistId)
    return trialist && (trialist.status === 'present' || trialist.status === 'absent') ? trialist : null
  }
  const formatMatchDateTime = (date: string, time: string) => format(new Date(date + 'T' + time), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })

  const predefinedFormations: Record<string, { name: string; positions: { id: string; name: string; x: number; y: number; roleShort?: string }[] }> = {
    '4-4-2': { name: '4-4-2', positions: [
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
    ] },
    '4-3-3': { name: '4-3-3', positions: [
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
    ] },
    '3-5-2': { name: '3-5-2', positions: [
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
    ] }
  }

  const getAllFormations = () => {
    const formations = { ...predefinedFormations }
    customFormations.forEach(cf => { formations[cf.name] = { name: cf.name, positions: cf.positions } })
    return formations
  }
  const formations = getAllFormations()
  const getFormationFromLineup = (formationIdentifier: string) => {
    const customFormation = customFormations.find(f => f.id === formationIdentifier)
    if (customFormation) return { name: customFormation.name, positions: customFormation.positions }
    return formations[formationIdentifier] || null
  }

  const downloadFormation = async () => {
    if (!lineup || !getFormationFromLineup(lineup.formation)) { toast.error('Nessuna formazione disponibile'); return }
    const exportElement = document.getElementById('formation-export')
    if (!exportElement) return
    const canvas = await html2canvas(exportElement, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true, logging: false })
    const link = document.createElement('a')
    link.download = `formazione-${match?.opponent_name || 'match'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>)
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md"><CardHeader><CardTitle className="text-destructive">Errore</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{error}</p></CardContent></Card>
    </div>
  )
  if (!match) return <Navigate to="/not-found" replace />

  const isExpired = deadline && new Date() > deadline

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Registrazione Partita</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Conferma la tua presenza per questa partita</p>
        </div>

        {/* Match Info */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="break-words">{match.opponent_name}</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
              <span>{formatMatchDateTime(match.match_date, match.match_time)}</span>
              {match.location && (<span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{match.location}</span>)}
              <span className="ml-auto font-semibold">Risultato: {score.us} - {score.opp}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {deadline && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <span className="font-medium text-sm sm:text-base">{isExpired ? 'Registrazioni chiuse' : 'Tempo per registrarsi (chiude 4h prima):'}</span>
                <Badge variant={isExpired ? 'destructive' : 'default'} className="text-xs sm:text-sm px-2 sm:px-3 py-1 self-start sm:self-center">
                  {isExpired ? 'Tempo scaduto' : timeLeft}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {!isExpired ? (
          <Card>
            <CardHeader>
              <CardTitle>Conferma la tua presenza</CardTitle>
              <CardDescription>Seleziona il tuo nome (giocatore o provinante) e indica se sarai presente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Giocatore o Provinante</label>
                <Select value={selectedEntity} onValueChange={(v: SelectEntity) => setSelectedEntity(v)}>
                  <SelectTrigger className="h-12 min-h-[48px] sm:min-h-[48px]">
                    <SelectValue placeholder="Seleziona il tuo nome" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] sm:max-h-[250px]">
                    {players.length > 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">Giocatori</div>
                    )}
                    {players.map(p => {
                      const registration = getPlayerRegistration(p.id)
                      return (
                        <SelectItem key={p.id} value={`player:${p.id}` as SelectEntity} disabled={!!registration} className="py-3">
                          <div className="flex items-center gap-3 w-full">
                            <PlayerAvatar firstName={p.first_name} lastName={p.last_name} size="sm" />
                            <span className="font-medium">{p.first_name} {p.last_name}</span>
                            {p.jersey_number && (<Badge variant="outline">#{p.jersey_number}</Badge>)}
                          </div>
                        </SelectItem>
                      )
                    })}
                    {trialistsInvited.length > 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">Provinanti</div>
                    )}
                    {trialistsInvited.map(t => {
                      const registration = getTrialistRegistration(t.id)
                      console.log(`Rendering trialist ${t.id}:`, { trialist: t, registration, disabled: !!registration })
                      return (
                        <SelectItem key={t.id} value={`trialist:${t.id}` as SelectEntity} disabled={!!registration} className="py-3">
                          <div className="flex items-center gap-3 w-full">
                            <PlayerAvatar firstName={t.first_name} lastName={t.last_name} size="sm" />
                            <span className="font-medium">{t.first_name} {t.last_name}</span>
                            {registration && (
                              <Badge variant={registration.status === 'present' ? 'default' : 'secondary'} className="ml-auto text-xs">
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
                <Select value={selectedStatus} onValueChange={(v: 'pending' | 'present' | 'absent') => setSelectedStatus(v)}>
                  <SelectTrigger className="h-12 min-h-[48px] sm:min-h-[48px]">
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] sm:max-h-[250px]">
                    <SelectItem value="pending"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" /> In attesa</div></SelectItem>
                    <SelectItem value="present"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Presente</div></SelectItem>
                    <SelectItem value="absent"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /> Assente</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !selectedEntity} className="w-full h-12 text-lg">
                {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Conferma Registrazione
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="p-3 sm:p-4 bg-muted/50 rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Registrazioni chiuse</span>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Riepilogo Registrazioni</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              // Debug per verificare i dati
              console.log('Conteggio - Dati disponibili:', {
                players: players.length,
                trialistsInvited: trialistsInvited.length,
                existingAttendance: existingAttendance.length,
                trialistsWithStatus: trialistsInvited.filter(t => t.status === 'present' || t.status === 'absent').length
              })
              
              // Conteggio giocatori (da existingAttendance)
              const playerPresent = existingAttendance.filter(a => a.status === 'present').length
              const playerAbsent = existingAttendance.filter(a => a.status === 'absent').length
              const playerResponded = existingAttendance.length
              const playerNoResponse = Math.max(0, players.length - playerResponded)
              
              // Conteggio trialist (da trialistsInvited.status)
              const trialistPresent = trialistsInvited.filter(t => t.status === 'present').length
              const trialistAbsent = trialistsInvited.filter(t => t.status === 'absent').length
              const trialistResponded = trialistPresent + trialistAbsent
              const trialistNoResponse = Math.max(0, trialistsInvited.length - trialistResponded)
              
              // Totali
              const presentTotal = playerPresent + trialistPresent
              const absentTotal = playerAbsent + trialistAbsent
              const totalEntities = players.length + trialistsInvited.length
              const totalResponded = playerResponded + trialistResponded
              const totalNoResponse = totalEntities - totalResponded
              
              console.log('Conteggio - Risultati:', {
                playerPresent, playerAbsent, playerResponded, playerNoResponse,
                trialistPresent, trialistAbsent, trialistResponded, trialistNoResponse,
                presentTotal, absentTotal, totalResponded, totalNoResponse
              })
              
              return (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-2xl font-bold text-green-600">{presentTotal}</div><div className="text-sm text-muted-foreground">Presenti</div></div>
                    <div><div className="text-2xl font-bold text-red-600">{absentTotal}</div><div className="text-sm text-muted-foreground">Assenti</div></div>
                    <div><div className="text-2xl font-bold text-muted-foreground">{totalNoResponse}</div><div className="text-sm text-muted-foreground">Non risposto</div></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">Giocatori</div>
                      <div className="text-sm text-muted-foreground">
                        Presenti: {playerPresent} | Assenti: {playerAbsent} | Non risposto: {playerNoResponse}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">Provinanti</div>
                      <div className="text-sm text-muted-foreground">
                        Presenti: {trialistPresent} | Assenti: {trialistAbsent} | Non risposto: {trialistNoResponse}
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </CardContent>
        </Card>



        {lineup && (
          <Card className="shadow-lg">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Target className="h-4 w-4" />Formazione - {getFormationFromLineup(lineup.formation)?.name || lineup.formation}</CardTitle>
                <Button variant="outline" size="sm" onClick={downloadFormation} className="flex items-center gap-2 text-xs sm:text-sm"><Download className="h-4 w-4" />Scarica PNG</Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
                <div className="lg:col-span-2">
                  <div className="relative bg-gradient-to-b from-green-100 to-green-200 border-2 border-white rounded-lg shadow-lg overflow-hidden mx-auto" style={{ aspectRatio: '2/3', maxWidth: '320px', width: '100%', minHeight: '360px', maxHeight: '480px' }}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,100,0,0.1) 5px, rgba(0,100,0,0.1) 10px)' }} />
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white transform -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 sm:w-20 h-16 sm:h-20 border-2 border-white rounded-full" />
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-l-2 border-r-2 border-b-2 border-white" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-l-2 border-r-2 border-t-2 border-white" />
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/4 h-1/12 border-l-2 border-r-2 border-b-2 border-white" />
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-1/12 border-l-2 border-r-2 border-t-2 border-white" />
                    {getFormationFromLineup(lineup.formation)?.positions.map(position => {
                      const playerId = lineup.players_data?.positions?.[position.id]
                      const player = playerId ? players.find(p => p.id === playerId) : null
                      return (
                        <div key={position.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${position.x}%`, top: `${position.y}%` }} title={player ? `${player.first_name} ${player.last_name}` : position.name}>
                          {player ? (
                            <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="md" className="border-2 border-white shadow-lg" />
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white bg-white/20 flex items-center justify-center"><Users className="w-5 h-5 text-white/70" /></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" />Titolari</h3>
                  {[
                    { name: 'Portiere', roles: ['P', 'Portiere'], color: 'bg-yellow-500' },
                    { name: 'Difesa', roles: ['TD','DC','DCD','DCS','TS','Difensore centrale','Difensore centrale sinistro','Difensore centrale destro','Terzino destro','Terzino sinistro'], color: 'bg-blue-500' },
                    { name: 'Centrocampo', roles: ['ED','MC','ES','MED','MD','MS','REG','QD','QS','Centrocampista','Mediano','Mezzala','Quinto','Regista'], color: 'bg-green-500' },
                    { name: 'Attacco', roles: ['ATT','PU','AD','AS','Attaccante','Punta','Ala'], color: 'bg-red-500' }
                  ].map(sector => {
                    const sectorPlayers = getFormationFromLineup(lineup.formation)?.positions
                      .filter(position => {
                        const hasPlayer = lineup.players_data?.positions?.[position.id]
                        const roleToCheck = position.roleShort || (position as any).role || position.name || ''
                        return hasPlayer && sector.roles.some(r => roleToCheck.toLowerCase() === r.toLowerCase())
                      }) || []
                    if (sectorPlayers.length === 0) return null
                    return (
                      <div key={sector.name} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${sector.color}`} />
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{sector.name}</h4>
                        </div>
                        <div className="space-y-1 pl-5">
                          {sectorPlayers.map(position => {
                            const pid = lineup.players_data?.positions?.[position.id]
                            const player = players.find(p => p.id === pid)
                            if (!player) return null
                            return (
                              <div key={position.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="sm" className="border-2 border-white" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{player.first_name} {player.last_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{position.roleShort || position.name}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {bench.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Users className="h-4 w-4" />Convocati ({bench.length})</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {bench.map((b) => (
                  <div key={b.id} className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <PlayerAvatar firstName={b.players?.first_name} lastName={b.players?.last_name} avatarUrl={b.players?.avatar_url} size="md" className="mb-2" />
                    <div className="text-center">
                      <p className="text-xs font-medium leading-tight truncate max-w-[120px]">{b.players?.first_name}</p>
                      <p className="text-xs font-medium leading-tight truncate max-w-[120px]">{b.players?.last_name}</p>
                      {b.players?.jersey_number && (<p className="text-xs text-muted-foreground mt-1">#{b.players.jersey_number}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {lineup && getFormationFromLineup(lineup.formation) && (
          <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
            <FormationExporter
              id="formation-export"
              lineup={lineup.players_data?.positions ? Object.entries(lineup.players_data.positions).map(([positionId, playerId]) => ({
                player_id: playerId as string,
                position_x: getFormationFromLineup(lineup.formation)?.positions.find((p: any) => p.id === positionId)?.x || 50,
                position_y: getFormationFromLineup(lineup.formation)?.positions.find((p: any) => p.id === positionId)?.y || 50,
                player: players.find(p => p.id === playerId)
              })) : []}
              formation={getFormationFromLineup(lineup.formation)!}
              sessionTitle={match?.opponent_name || 'Partita'}
              teamName="Team"
              jerseyUrl={defaultJersey?.image_url}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchPublicRegistration