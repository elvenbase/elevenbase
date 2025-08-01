import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Clock, MapPin, Users, Target, ArrowLeft, Settings, Share } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useTrainingSessions, useTrainingAttendance, usePlayers } from '@/hooks/useSupabaseData'
import { AttendanceForm } from '@/components/forms/AttendanceForm'
import LineupManager from '@/components/LineupManager'
import PublicLinkSharing from '@/components/PublicLinkSharing'

const SessionManagement = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  
  const { data: sessions, isLoading: loadingSessions } = useTrainingSessions()
  const { data: attendance, isLoading: loadingAttendance } = useTrainingAttendance(sessionId!)
  const { data: players } = usePlayers()

  const session = sessions?.find(s => s.id === sessionId)

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(date + 'T' + time)
    return format(sessionDate, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })
  }

  const getStatusBadge = (session: any) => {
    if (session.is_closed) {
      return <Badge variant="secondary">Chiusa</Badge>
    }
    
    const now = new Date()
    const sessionDate = new Date(session.session_date + 'T' + session.start_time)
    
    if (sessionDate < now) {
      return <Badge variant="outline">Passata</Badge>
    }
    
    return <Badge variant="default">Programmata</Badge>
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Calcola statistiche presenze
  const attendanceStats = {
    present: attendance?.filter(a => a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.status === 'absent').length || 0,
    noResponse: (players?.length || 0) - (attendance?.length || 0),
    totalPlayers: players?.length || 0
  }

  if (loadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Caricamento sessione...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/training" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/training">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna agli Allenamenti
                </Link>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{session.title}</h1>
                  {getStatusBadge(session)}
                </div>
                <p className="text-muted-foreground">{session.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Modifica Sessione
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data e Ora</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(session.session_date, session.start_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Durata</p>
                  <p className="text-xs text-muted-foreground">
                    {session.start_time} - {session.end_time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {session.location && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Luogo</p>
                    <p className="text-xs text-muted-foreground">{session.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Presenze</p>
                  <p className="text-xs text-muted-foreground">
                    {attendanceStats.present} presenti, {attendanceStats.absent} assenti
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
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
                  Gestisci le presenze dei giocatori per questa sessione di allenamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionId && (
                  <AttendanceForm 
                    sessionId={sessionId}
                    sessionTitle={session.title}
                    key={refreshKey}
                  />
                )}
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
                  Imposta la formazione per questa sessione di allenamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionId && (
                  <LineupManager 
                    sessionId={sessionId} 
                    key={refreshKey} 
                    presentPlayers={attendance?.filter(a => a.status === 'present').map(a => ({
                      id: a.player_id,
                      first_name: a.players?.first_name || '',
                      last_name: a.players?.last_name || '',
                      jersey_number: players?.find(p => p.id === a.player_id)?.jersey_number,
                      position: players?.find(p => p.id === a.player_id)?.position,
                      avatar_url: players?.find(p => p.id === a.player_id)?.avatar_url
                    })) || []}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public-link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-5 w-5" />
                  Link Pubblico per Registrazioni
                </CardTitle>
                <CardDescription>
                  Condividi il link pubblico per permettere ai giocatori di registrare la loro presenza
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublicLinkSharing 
                  session={session} 
                  attendanceStats={attendanceStats}
                  onRefresh={handleRefresh}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SessionManagement