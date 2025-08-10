import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Target, Share, ArrowLeft } from 'lucide-react'
import { useMatch, useMatchEvents } from '@/hooks/useSupabaseData'
import LineupManager from '@/components/LineupManager'
import { ConvocatiManager } from '@/components/ConvocatiManager'
import PublicLinkSharing from '@/components/PublicLinkSharing'

// TODO: swap out with real match attendance components/hooks
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/matches">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alle Partite
                </Link>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-primary">{match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}</h1>
                  <Badge variant="outline">{new Date(match.match_date).toLocaleDateString()} {match.match_time}</Badge>
                </div>
                {match.location && (
                  <p className="text-sm text-muted-foreground">{match.location}</p>
                )}
              </div>
            </div>
            <div className="text-3xl font-bold">
              {score.us} - {score.opp}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Presenze
            </TabsTrigger>
            <TabsTrigger value="lineup" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Formazione
            </TabsTrigger>
            <TabsTrigger value="public-link" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Link Pubblico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestione Presenze
                </CardTitle>
                <CardDescription>
                  Copia logiche di AttendanceForm: auto-registrazione, conferma coach, ritardo, note
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: implement MatchAttendanceForm replicando AttendanceForm con tabella match_attendance */}
                <div className="text-sm text-muted-foreground">In arrivo: gestione convocati/presenze partita</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Formazione
                </CardTitle>
                <CardDescription>
                  Copia logiche di LineupManager e ConvocatiManager con export PNG
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Reuse existing lineup components; wire to match-specific state when schema pronta */}
                <LineupManager sessionId={id} presentPlayers={[]} onLineupChange={() => {}} />
                <div className="mt-8 pt-8 border-t">
                  <ConvocatiManager sessionId={id} allPlayers={[]} attendance={[]} playersInLineup={[]} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public-link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-5 w-5" />
                  Link Pubblico
                </CardTitle>
                <CardDescription>
                  Copia logiche di PublicLinkSharing per la partita
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder: riuso del componente attuale in attesa dei campi match */}
                <PublicLinkSharing session={{
                  id,
                  title: `${match.home_away === 'home' ? 'vs' : '@'} ${match.opponent_name}`,
                  description: '',
                  session_date: match.match_date,
                  start_time: match.match_time,
                  end_time: match.match_time,
                  is_closed: false,
                } as any} attendanceStats={{ present: 0, absent: 0, noResponse: 0, totalPlayers: 0 }} onRefresh={() => {}} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MatchDetail