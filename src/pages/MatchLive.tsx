import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Target, ArrowLeft, Play, Pause, Clock3, Plus, Shield, Redo2, StickyNote, Repeat } from 'lucide-react'
import { useMatch, useMatchEvents, useMatchAttendance, useMatchTrialistInvites, usePlayers } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateMatch } from '@/hooks/useSupabaseData'
import { useQueryClient } from '@tanstack/react-query'

const computeScore = (events: any[]) => {
  let us = 0, opp = 0
  for (const e of events) {
    if (e.event_type === 'goal') { e.team === 'us' ? us++ : opp++ }
    if (e.event_type === 'own_goal') { e.team === 'us' ? opp++ : us++ }
    if (e.event_type === 'pen_scored') { e.team === 'us' ? us++ : opp++ }
  }
  return { us, opp }
}

const MatchLive = () => {
  const { id } = useParams<{ id: string }>()
  const { data: match } = useMatch(id || '')
  const { data: events = [] } = useMatchEvents(id || '')
  const { data: attendance = [] } = useMatchAttendance(id || '')
  const { data: trialistInvites = [] } = useMatchTrialistInvites(id || '')
  const { data: players = [] } = usePlayers()
  const { lineup, loadLineup } = useMatchLineupManager(id || '')
  useEffect(() => { if (id) loadLineup() }, [id])
  const updateMatch = useUpdateMatch()
  const queryClient = useQueryClient()

  const score = useMemo(() => computeScore(events), [events])
  const presentIds = useMemo(() => new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id)), [attendance])
  const titolariIds = useMemo(() => new Set(Object.values(lineup?.players_data?.positions || {})), [lineup])
  const trialistsPresent = useMemo(() => (trialistInvites as any[]).filter(t => t.status === 'present').map(t => ({ id: t.trialist_id, first_name: t.trialists?.first_name || 'Trialist', last_name: t.trialists?.last_name || '', isTrialist: true })), [trialistInvites])
  const titolari = useMemo(() => {
    const roster = players.filter((p: any) => titolariIds.has(p.id))
    const tr = trialistsPresent.filter((t: any) => titolariIds.has(t.id))
    return [...roster, ...tr]
  }, [players, titolariIds, trialistsPresent])
  const convocati = useMemo(() => {
    const roster = players.filter((p: any) => presentIds.has(p.id))
    const tr = trialistsPresent
    return [...roster, ...tr]
  }, [players, presentIds, trialistsPresent])
  const playersById = useMemo(() => Object.fromEntries(players.map((p: any) => [p.id, p])), [players])
  const trialistsById = useMemo(() => Object.fromEntries(trialistInvites.map((t: any) => [t.trialist_id, { id: t.trialist_id, first_name: t.trialists?.first_name || 'Trialist', last_name: t.trialists?.last_name || '', isTrialist: true }])), [trialistInvites])

  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  // Initialize timer from match fields
  useEffect(() => {
    if (!match) return
    const offset = (match as any).clock_offset_seconds || 0
    const startedAt = (match as any).clock_started_at ? new Date((match as any).clock_started_at).getTime() : null
    if (startedAt) {
      setRunning(true)
      setSeconds(Math.floor((Date.now() - startedAt) / 1000) + offset)
    } else {
      setRunning(false)
      setSeconds(offset)
    }
  }, [match])
  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [running])

  const postEvent = async (evt: { event_type: string; team?: 'us'|'opponent'; player_id?: string|null; assister_id?: string|null; comment?: string|null }) => {
    if (!id) return
    const { error } = await supabase.from('match_events').insert({ match_id: id, ...evt, team: evt.team || 'us', metadata: { live: true } })
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['match-events', id] })
    } else {
      console.error('Errore inserimento evento live:', error)
    }
  }
  const [lastEvents, setLastEvents] = useState<any[]>([])
  useEffect(() => {
    setLastEvents(events.slice(-6).reverse())
  }, [events])

  // Player selection for events
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const getDisplayName = (id: string) => {
    const p = playersById[id] || trialistsById[id]
    return p ? `${p.first_name} ${p.last_name}` : id
  }

  // Substitution dialog
  const [subOpen, setSubOpen] = useState(false)
  const [subOutId, setSubOutId] = useState<string>('')
  const [subInId, setSubInId] = useState<string>('')
  const onFieldIds = useMemo(() => {
    // derive on field applying substitution events
    const start = new Set<string>(titolariIds as any)
    events.filter((e: any) => e.event_type === 'substitution').forEach((e: any) => {
      const outId = e.metadata?.out_id as string | undefined
      const inId = e.metadata?.in_id as string | undefined
      if (outId) start.delete(outId)
      if (inId) start.add(inId)
    })
    return start
  }, [titolariIds, events])
  const availableInIds = useMemo(() => convocati.map((c: any) => c.id).filter((id: string) => !onFieldIds.has(id)), [convocati, onFieldIds])
  const doSubstitution = async () => {
    if (!id || !subOutId || !subInId) return
    const { error } = await supabase.from('match_events').insert({ match_id: id, event_type: 'substitution', metadata: { out_id: subOutId, in_id: subInId }, team: 'us' })
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['match-events', id] })
    } else {
      console.error('Errore inserimento sostituzione:', error)
    }
    setSubOpen(false); setSubOutId(''); setSubInId('')
  }

  // Period controls
  const period = (match as any)?.live_state || 'not_started'
  const setPeriod = async (p: string) => {
    if (!id) return
    await updateMatch.mutateAsync({ id, updates: { live_state: p as any } })
  }
  const toggleTimer = async () => {
    if (!id) return
    const now = new Date()
    if (!running) {
      await updateMatch.mutateAsync({ id, updates: { clock_started_at: now.toISOString() } })
      setRunning(true)
    } else {
      const startedAt = (match as any).clock_started_at ? new Date((match as any).clock_started_at).getTime() : null
      const prevOffset = (match as any).clock_offset_seconds || 0
      const add = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
      const newOffset = prevOffset + add
      await updateMatch.mutateAsync({ id, updates: { clock_started_at: null as any, clock_offset_seconds: newOffset } })
      setRunning(false)
      setSeconds(newOffset)
    }
  }

  if (!id) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/match/${id}`}><ArrowLeft className="h-4 w-4 mr-2" />Torna al dettaglio</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{match?.opponent_name}</Badge>
            <Badge variant="default" className="text-base">{score.us} - {score.opp}</Badge>
            <div className="flex items-center gap-1 px-2 py-1 rounded border">
              <Clock3 className="h-4 w-4" />
              <span className="tabular-nums">{String(Math.floor(seconds/60)).padStart(2, '0')}:{String(seconds%60).padStart(2, '0')}</span>
              <Button variant="ghost" size="sm" onClick={toggleTimer} className="h-6 px-2">
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            <Select value={period} onValueChange={setPeriod as any}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Pre partita</SelectItem>
                <SelectItem value="first_half">1° Tempo</SelectItem>
                <SelectItem value="half_time">Intervallo</SelectItem>
                <SelectItem value="second_half">2° Tempo</SelectItem>
                <SelectItem value="extra_time">Supplementari</SelectItem>
                <SelectItem value="ended">Fine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />In campo</CardTitle>
            </CardHeader>
            <CardContent>
              {titolari.length === 0 ? (
                <div className="text-muted-foreground text-sm">Nessun titolare impostato. Imposta l'11 dalla sezione Formazione.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {titolari.map((p: any) => (
                    <div key={p.id} className={`p-2 rounded border flex items-center gap-2 cursor-pointer ${selectedPlayerId===p.id ? 'border-primary bg-primary/5' : ''}`} onClick={()=>setSelectedPlayerId(p.id)}>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="truncate">{p.first_name} {p.last_name}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedPlayerId && (
                  <span className="text-sm text-muted-foreground">Giocatore selezionato: <span className="font-medium">{getDisplayName(selectedPlayerId)}</span></span>
                )}
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'goal', team: 'us', player_id: selectedPlayerId || undefined })} disabled={!selectedPlayerId}><Plus className="h-4 w-4 mr-1" /> Gol</Button>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'assist', player_id: selectedPlayerId || undefined })} disabled={!selectedPlayerId}><Redo2 className="h-4 w-4 mr-1" /> Assist</Button>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'yellow_card', player_id: selectedPlayerId || undefined })} disabled={!selectedPlayerId}><Shield className="h-4 w-4 mr-1" /> Giallo</Button>
                <Button size="sm" variant="destructive" onClick={() => postEvent({ event_type: 'red_card', player_id: selectedPlayerId || undefined })} disabled={!selectedPlayerId}><Shield className="h-4 w-4 mr-1" /> Rosso</Button>
                <Dialog open={subOpen} onOpenChange={setSubOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Users className="h-4 w-4 mr-1" /> Sostituzione</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuova sostituzione</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Esce</Label>
                        <Select value={subOutId} onValueChange={setSubOutId}>
                          <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                          <SelectContent>
                            {Array.from(onFieldIds).map((id) => (
                              <SelectItem key={id} value={id}>{getDisplayName(id)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Entra</Label>
                        <Select value={subInId} onValueChange={setSubInId}>
                          <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                          <SelectContent>
                            {availableInIds.map((id) => (
                              <SelectItem key={id} value={id}>{getDisplayName(id)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSubOpen(false)}>Annulla</Button>
                        <Button onClick={doSubstitution} disabled={!subOutId || !subInId}><Repeat className="h-4 w-4 mr-1" /> Conferma</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'foul', player_id: selectedPlayerId || undefined })} disabled={!selectedPlayerId}><Shield className="h-4 w-4 mr-1" /> Fallo</Button>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'note', comment: selectedPlayerId ? `Nota su ${getDisplayName(selectedPlayerId)}` : 'Nota partita' })}><StickyNote className="h-4 w-4 mr-1" /> Nota</Button>
              </div>

              <div className="mt-6">
                <div className="font-semibold mb-2">Eventi recenti</div>
                <div className="space-y-1">
                  {lastEvents.map((e: any) => (
                    <div key={e.id} className="text-sm text-muted-foreground">
                      <span className="mr-2">[{new Date(e.created_at).toLocaleTimeString()}]</span>
                      <span className="mr-2">{e.event_type}</span>
                      {e.player_id && <span className="mr-2">{getDisplayName(e.player_id)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Convocati ({convocati.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {convocati.map((p: any) => (
                  <div key={p.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${selectedPlayerId===p.id ? 'border-primary bg-primary/5' : ''}`} onClick={()=>setSelectedPlayerId(p.id)}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div className="truncate">{p.first_name} {p.last_name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default MatchLive