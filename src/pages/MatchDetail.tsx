import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMatch, useMatchEvents, useCreateMatchEvent, usePlayers } from '@/hooks/useSupabaseData'
import { Users, Goal, FlagTriangleRight, StickyNote } from 'lucide-react'

const computeScore = (events: any[]) => {
  let us = 0
  let opp = 0
  for (const e of events) {
    if (e.event_type === 'goal') {
      if (e.team === 'us') us += 1
      else opp += 1
    }
    if (e.event_type === 'own_goal') {
      if (e.team === 'us') opp += 1
      else us += 1
    }
    if (e.event_type === 'pen_scored') {
      if (e.team === 'us') us += 1
      else opp += 1
    }
  }
  return { us, opp }
}

const LiveConsole = ({ matchId }: { matchId: string }) => {
  const { data: players = [] } = usePlayers()
  const createEvent = useCreateMatchEvent()
  const [team, setTeam] = useState<'us' | 'opponent'>('us')
  const [playerId, setPlayerId] = useState<string>('')
  const [assisterId, setAssisterId] = useState<string>('')
  const [comment, setComment] = useState('')

  const submit = async (event_type: string) => {
    await createEvent.mutateAsync({ match_id: matchId, team, event_type, player_id: playerId || null, assister_id: assisterId || null, comment: comment || null })
    setComment('')
    if (event_type !== 'assist') setAssisterId('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Console Live</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant={team === 'us' ? 'default' : 'outline'} onClick={() => setTeam('us')}>Noi</Button>
          <Button variant={team === 'opponent' ? 'default' : 'outline'} onClick={() => setTeam('opponent')}>Avversari</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select className="border rounded px-2 py-2" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Seleziona giocatore</option>
            {players.map((p: any) => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
          <select className="border rounded px-2 py-2" value={assisterId} onChange={(e) => setAssisterId(e.target.value)}>
            <option value="">Assist (opzionale)</option>
            {players.map((p: any) => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
          <input className="border rounded px-2 py-2" placeholder="Commento (opzionale)" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={() => submit('goal')} className="space-x-2"><Goal className="h-4 w-4" /><span>Gol</span></Button>
          <Button variant="outline" onClick={() => submit('assist')} className="space-x-2"><Users className="h-4 w-4" /><span>Assist</span></Button>
          <Button variant="outline" onClick={() => submit('yellow')} className="space-x-2"><FlagTriangleRight className="h-4 w-4" /><span>Giallo</span></Button>
          <Button variant="outline" onClick={() => submit('red')} className="space-x-2"><FlagTriangleRight className="h-4 w-4 text-destructive" /><span>Rosso</span></Button>
          <Button variant="outline" onClick={() => submit('own_goal')} className="space-x-2"><SoccerBall className="h-4 w-4" /><span>Autogol</span></Button>
          <Button variant="outline" onClick={() => submit('note')} className="space-x-2"><StickyNote className="h-4 w-4" /><span>Nota</span></Button>
        </div>
      </CardContent>
    </Card>
  )
}

const EventsTimeline = ({ matchId }: { matchId: string }) => {
  const { data: events = [], isLoading } = useMatchEvents(matchId)
  if (isLoading) return <div className="text-sm text-muted-foreground">Caricamento eventi...</div>
  if (events.length === 0) return <div className="text-sm text-muted-foreground">Nessun evento</div>
  return (
    <div className="space-y-2">
      {events.map((e: any) => (
        <div key={e.id} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant={e.team === 'us' ? 'default' : 'outline'} className="flex-shrink-0">{e.team === 'us' ? 'Noi' : 'Loro'}</Badge>
            <span className="truncate">{e.event_type}{e.player_id ? ` - ${e.players?.first_name || ''} ${e.players?.last_name || ''}` : ''}</span>
          </div>
          {e.comment && <span className="text-xs text-muted-foreground truncate max-w-[40%]">{e.comment}</span>}
        </div>
      ))}
    </div>
  )
}

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data: match, isLoading } = useMatch(id || '')
  const { data: events = [] } = useMatchEvents(id || '')

  const score = useMemo(() => computeScore(events), [events])

  useEffect(() => {
    // future: subscribe realtime
  }, [id])

  if (!id) return null
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Caricamento partita...</div>
  if (!match) return <div className="min-h-screen flex items-center justify-center">Partita non trovata</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">{match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span>{new Date(match.match_date).toLocaleDateString()}</span>
                <span>{match.match_time}</span>
              </div>
            </div>
            <div className="text-3xl font-bold">
              {score.us} - {score.opp}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="live" className="space-y-3">
          <TabsList>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="events">Eventi</TabsTrigger>
            <TabsTrigger value="lineup" disabled>Formazione</TabsTrigger>
            <TabsTrigger value="stats" disabled>Statistiche</TabsTrigger>
          </TabsList>
          <TabsContent value="live">
            <LiveConsole matchId={id} />
          </TabsContent>
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Timeline Eventi</CardTitle>
              </CardHeader>
              <CardContent>
                <EventsTimeline matchId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MatchDetail