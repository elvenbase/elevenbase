import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Target, Share, ArrowLeft } from 'lucide-react'
import { useMatch, useMatchEvents, useMatchAttendance, useEnsureMatchPublicSettings, useMatchTrialistInvites, usePlayers } from '@/hooks/useSupabaseData'
import LineupManager from '@/components/LineupManager'
import { ConvocatiManager } from '@/components/ConvocatiManager'
import PublicLinkSharing from '@/components/PublicLinkSharing'
import MatchAttendanceForm from '@/components/forms/MatchAttendanceForm'
import MatchLineupSection from '@/components/MatchLineupSection'
import MatchPublicLinkSharing from '@/components/MatchPublicLinkSharing'

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

const MiniJersey = ({ o }: { o: any }) => {
  if (!o) return null
  if (o.jersey_image_url) return <img src={o.jersey_image_url} alt="jersey" className="h-5 w-5 rounded object-cover" />
  const shape = o.jersey_shape as 'classic'|'stripes'|'hoops'|undefined
  const p = o.jersey_primary_color || '#008080'
  const s = o.jersey_secondary_color || '#ffffff'
  const style: React.CSSProperties = {}
  if (shape === 'stripes') {
    style.backgroundImage = `repeating-linear-gradient(90deg, ${p} 0 6px, ${s} 6px 12px)`
  } else if (shape === 'hoops') {
    style.backgroundImage = `repeating-linear-gradient(0deg, ${p} 0 6px, ${s} 6px 12px)`
  } else {
    style.backgroundColor = p
  }
  return <div className="h-5 w-5 rounded border" style={style} />
}

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data: match, isLoading } = useMatch(id || '')
  const { data: events = [] } = useMatchEvents(id || '')
  const { data: matchAttendance = [] } = useMatchAttendance(id || '')
  const { data: trialistInvites = [] } = useMatchTrialistInvites(id || '')
  const { data: allPlayers = [] } = usePlayers()
  const ensurePublic = useEnsureMatchPublicSettings()

  const score = useMemo(() => computeScore(events), [events])
  const attendanceStats = useMemo(() => {
    const playerPresent = matchAttendance.filter((a: any) => a.status === 'present').length
    const playerAbsent = matchAttendance.filter((a: any) => a.status === 'absent').length
    const trialistPresent = trialistInvites.filter((t: any) => t.status === 'present').length
    const trialistAbsent = trialistInvites.filter((t: any) => t.status === 'absent').length
    const present = playerPresent + trialistPresent
    const absent = playerAbsent + trialistAbsent
    const totalEntities = (allPlayers?.length || 0) + (trialistInvites?.length || 0)
    const responded = matchAttendance.length + trialistPresent + trialistAbsent
    const noResponse = Math.max(0, totalEntities - responded)
    return { present, absent, noResponse, totalPlayers: totalEntities }
  }, [matchAttendance, trialistInvites, allPlayers])

  useEffect(() => {
    // future: subscribe realtime
    if (id) ensurePublic.mutate(id)
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
              <Button variant="ghost" size="sm" className="text-foreground" asChild>
                <Link to="/matches">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alle Partite
                </Link>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-primary">{match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}</h1>
                  <MiniJersey o={match.opponents} />
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
                <MatchAttendanceForm matchId={id} />
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
                <MatchLineupSection matchId={id} />
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
                <MatchPublicLinkSharing match={{ id, opponent_name: match.opponent_name, match_date: match.match_date, match_time: match.match_time, public_link_token: match.public_link_token, allow_responses_until: match.allow_responses_until, is_closed: false }} attendanceStats={attendanceStats} onRefresh={() => {}} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MatchDetail