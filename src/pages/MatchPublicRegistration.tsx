import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Users, Target, Download } from 'lucide-react'
import { useCustomFormations } from '@/hooks/useCustomFormations'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import FormationExporter from '@/components/FormationExporter'
import html2canvas from 'html2canvas'

interface Player { id: string; first_name: string; last_name: string; jersey_number?: number }
interface Trialist { id: string; first_name: string; last_name: string; status?: string; self_registered?: boolean }
interface MatchInfo { id: string; opponent_name: string; match_date: string; match_time: string }
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
      setMatch(data.match)
      setPlayers(data.players)
      setTrialistsInvited(data.trialistsInvited || [])
      setExistingAttendance(data.existingAttendance)
      setDeadline(new Date(data.deadline))
      setLineup(data.lineup || null)
      setBench(data.bench || [])
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
      await loadData()
      setSelectedEntity(''); setSelectedStatus('present')
    } catch (err: any) {
      console.error('Errore nella registrazione:', err)
      toast.error('Errore nella registrazione')
    } finally { setSubmitting(false) }
  }

  const getPlayerRegistration = (playerId: string) => existingAttendance.find(a => a.player_id === playerId)
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Partita: {match.opponent_name}</CardTitle>
            <CardDescription>{formatMatchDateTime(match.match_date, match.match_time)}</CardDescription>
          </CardHeader>
          <CardContent>
            {deadline && (
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {isExpired ? 'Tempo scaduto' : `Tempo rimasto: ${timeLeft}`}
              </Badge>
            )}
          </CardContent>
        </Card>

        {!isExpired && (
          <Card>
            <CardHeader>
              <CardTitle>Conferma la tua presenza</CardTitle>
              <CardDescription>Seleziona il tuo nome (giocatore o provinante) e indica se sarai presente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Giocatore o Provinante</label>
                <Select value={selectedEntity} onValueChange={(v: SelectEntity) => setSelectedEntity(v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleziona il tuo nome" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.length > 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">Giocatori</div>
                    )}
                    {players.map(p => {
                      const registration = getPlayerRegistration(p.id)
                      return (
                        <SelectItem key={p.id} value={`player:${p.id}` as SelectEntity} disabled={!!registration}>
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
                    {trialistsInvited.map(t => (
                      <SelectItem key={t.id} value={`trialist:${t.id}` as SelectEntity}>
                        <div className="flex items-center gap-3 w-full">
                          <PlayerAvatar firstName={t.first_name} lastName={t.last_name} size="sm" />
                          <span className="font-medium">{t.first_name} {t.last_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Presenza</label>
                <Select value={selectedStatus} onValueChange={(v: 'pending' | 'present' | 'absent') => setSelectedStatus(v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
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
        )}

        <Card>
          <CardHeader><CardTitle>Riepilogo Registrazioni</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl font-bold text-green-600">{existingAttendance.filter(a => a.status === 'present').length}</div><div className="text-sm text-muted-foreground">Presenti</div></div>
              <div><div className="text-2xl font-bold text-red-600">{existingAttendance.filter(a => a.status === 'absent').length}</div><div className="text-sm text-muted-foreground">Assenti</div></div>
              <div><div className="text-2xl font-bold text-muted-foreground">{players.length - existingAttendance.length}</div><div className="text-sm text-muted-foreground">Non risposto</div></div>
            </div>
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
                  <div className="space-y-1">
                    {getFormationFromLineup(lineup.formation)?.positions.filter(pos => lineup.players_data?.positions?.[pos.id]).map(pos => {
                      const pid = lineup.players_data?.positions?.[pos.id]
                      const player = players.find(p => p.id === pid)
                      if (!player) return null
                      return (
                        <div key={pos.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                          <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="sm" className="border-2 border-white" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{player.first_name} {player.last_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{pos.roleShort || pos.name}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Users className="h-4 w-4" />Convocati {bench.length > 0 && `(${bench.length})`}</CardTitle></CardHeader>
          <CardContent className="p-4">
            {bench.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun convocato</p>
            ) : (
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
            )}
          </CardContent>
        </Card>

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