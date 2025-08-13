import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Target, ArrowLeft, Play, Pause, Clock3, Plus, Shield, Redo2, StickyNote } from 'lucide-react'
import { useMatch, useMatchEvents, useMatchAttendance, useMatchTrialistInvites, usePlayers } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import { supabase } from '@/integrations/supabase/client'

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

  const score = useMemo(() => computeScore(events), [events])
  const presentIds = useMemo(() => new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id)), [attendance])
  const titolariIds = useMemo(() => new Set(Object.values(lineup?.players_data?.positions || {})), [lineup])
  const titolari = useMemo(() => players.filter((p: any) => titolariIds.has(p.id)), [players, titolariIds])
  const convocati = useMemo(() => players.filter((p: any) => presentIds.has(p.id)), [players, presentIds])
  const playersById = useMemo(() => Object.fromEntries(players.map((p: any) => [p.id, p])), [players])

  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [running])

  const postEvent = async (evt: { event_type: string; team?: 'us'|'opponent'; player_id?: string|null; assister_id?: string|null; comment?: string|null }) => {
    if (!id) return
    await supabase.from('match_events').insert({ match_id: id, ...evt, team: evt.team || 'us', metadata: { live: true } })
  }
  const [lastEvents, setLastEvents] = useState<any[]>([])
  useEffect(() => {
    setLastEvents(events.slice(-6).reverse())
  }, [events])

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
              <Button variant="ghost" size="sm" onClick={() => setRunning(r => !r)} className="h-6 px-2">
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
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
                    <div key={p.id} className="p-2 rounded border flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="truncate">{p.first_name} {p.last_name}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'goal', team: 'us' })}><Plus className="h-4 w-4 mr-1" /> Gol</Button>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'assist' })}><Redo2 className="h-4 w-4 mr-1" /> Assist</Button>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'yellow_card' })}><Shield className="h-4 w-4 mr-1" /> Giallo</Button>
                <Button size="sm" variant="destructive" onClick={() => postEvent({ event_type: 'red_card' })}><Shield className="h-4 w-4 mr-1" /> Rosso</Button>
                <Button size="sm" variant="outline"><Users className="h-4 w-4 mr-1" /> Sostituzione</Button>
                <Button size="sm" variant="outline" onClick={() => postEvent({ event_type: 'note', comment: 'Nota partita' })}><StickyNote className="h-4 w-4 mr-1" /> Nota</Button>
              </div>

              <div className="mt-6">
                <div className="font-semibold mb-2">Eventi recenti</div>
                <div className="space-y-1">
                  {lastEvents.map((e: any) => (
                    <div key={e.id} className="text-sm text-muted-foreground">
                      <span className="mr-2">[{new Date(e.created_at).toLocaleTimeString()}]</span>
                      <span className="mr-2">{e.event_type}</span>
                      {e.player_id && <span className="mr-2">{playersById[e.player_id]?.first_name} {playersById[e.player_id]?.last_name}</span>}
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
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded border">
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