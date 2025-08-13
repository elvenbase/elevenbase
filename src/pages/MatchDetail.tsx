import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Target, Share, ArrowLeft } from 'lucide-react'
import { useMatch, useMatchEvents, useMatchAttendance, useEnsureMatchPublicSettings, useMatchTrialistInvites, usePlayers, useUpdateMatch, useSetMatchTrialistInvites, useTrialists } from '@/hooks/useSupabaseData'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const updateMatch = useUpdateMatch()
  const setMatchTrialistInvites = useSetMatchTrialistInvites()
  const { data: allTrialists = [] } = useTrialists()
  const [editOpen, setEditOpen] = useState(false)
  const [allowTrialists, setAllowTrialists] = useState(false)
  const [selectedTrialists, setSelectedTrialists] = useState<string[]>([])

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
  
  // Initialize edit state when dialog opens
  const openEdit = () => {
    setAllowTrialists(!!(match as any).allow_trialists)
    setSelectedTrialists((trialistInvites || []).map((t: any) => t.trialist_id))
    setEditOpen(true)
  }
  
  const handleSaveEdit = async () => {
    if (!id) return
    await updateMatch.mutateAsync({ id, updates: { allow_trialists: allowTrialists } })
    if (allowTrialists) {
      await setMatchTrialistInvites.mutateAsync({ matchId: id, trialistIds: selectedTrialists })
    } else {
      await setMatchTrialistInvites.mutateAsync({ matchId: id, trialistIds: [] })
    }
    setEditOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-foreground" asChild>
                  <Link to="/matches">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Torna alle Partite
                  </Link>
                </Button>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">{match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}</h1>
                    <MiniJersey o={match.opponents} />
                    <Badge variant="outline" className="text-xs sm:text-sm whitespace-nowrap">{new Date(match.match_date).toLocaleDateString()} {match.match_time}</Badge>
                  </div>
                  {match.location && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{match.location}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={openEdit}>Modifica</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifica Partita</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input id="allow_trialists" type="checkbox" checked={allowTrialists} onChange={(e: any) => setAllowTrialists(e.target.checked)} />
                        <label htmlFor="allow_trialists" className="text-sm">Abilita provinanti per questa partita</label>
                      </div>
                      {allowTrialists && (
                        <div className="space-y-2">
                          <Label className="text-sm">Seleziona provinanti</Label>
                          <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                            {(allTrialists || []).map((t: any) => {
                              const checked = selectedTrialists.includes(t.id)
                              return (
                                <label key={t.id} className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" checked={checked} onChange={(e) => setSelectedTrialists((prev: string[]) => e.target.checked ? [...prev, t.id] : prev.filter((id: string) => id !== t.id))} />
                                  <span className="truncate">{t.first_name} {t.last_name}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Annulla</Button>
                        <Button onClick={handleSaveEdit} disabled={updateMatch.isPending}>Salva</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button asChild size="sm"><Link to={`/match/${id}/live`}>Live</Link></Button>
                <div className="text-2xl sm:text-3xl font-bold text-center sm:text-right">
                  {score.us} - {score.opp}
                </div>
              </div>
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