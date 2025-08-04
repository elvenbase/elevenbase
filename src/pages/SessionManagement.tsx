
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
import { TrainingForm } from '@/components/forms/TrainingForm'
import LineupManager from '@/components/LineupManager'
import { ConvocatiManager } from '@/components/ConvocatiManager'
import PublicLinkSharing from '@/components/PublicLinkSharing'

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  communication_type?: 'party' | 'discord' | 'altro' | null;
  communication_details?: string;
  max_participants?: number;
  is_closed: boolean;
  public_link_token?: string;
  allow_responses_until?: string;
}

const SessionManagement = () => {
  const { id: sessionId } = useParams<{ id: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  
  const { data: sessions, isLoading: loadingSessions } = useTrainingSessions()
  const { data: attendance, isLoading: loadingAttendance } = useTrainingAttendance(sessionId!)
  const { data: players } = usePlayers()

  const session = sessions?.find(s => s.id === sessionId) as TrainingSession | undefined

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(date + 'T' + time)
    return format(sessionDate, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })
  }

  const getStatusBadge = (session: TrainingSession) => {
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="border-b bg-card rounded-lg mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-3 sm:py-6">
          {/* Mobile layout - stacked */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/training">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna agli Allenamenti
                </Link>
              </Button>
              <TrainingForm 
                session={session} 
                mode="edit"
              >
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              </TrainingForm>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold">{session.title}</h1>
                {getStatusBadge(session)}
              </div>
              {session.description && (
                <p className="text-sm text-muted-foreground">{session.description}</p>
              )}
            </div>
          </div>

          {/* Desktop layout - horizontal */}
          <div className="hidden sm:flex items-center justify-between">
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
              <TrainingForm 
                session={session} 
                mode="edit"
              >
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Modifica Sessione
                </Button>
              </TrainingForm>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Data e Ora</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDateTime(session.session_date, session.start_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Durata</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.start_time} - {session.end_time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(session.communication_type || session.location) && (
            <Card>
              <CardContent className="p-3 sm:pt-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium">Comunicazioni</p>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        // Usa i nuovi campi strutturati se disponibili
                        if (session.communication_type) {
                          const type = session.communication_type.charAt(0).toUpperCase() + session.communication_type.slice(1);
                          if (session.communication_type === 'discord' && session.communication_details) {
                            return (
                              <div className="space-y-1">
                                <div>{type}</div>
                                <a 
                                  href={session.communication_details} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline truncate block"
                                >
                                  {session.communication_details}
                                </a>
                              </div>
                            );
                          } else if (session.communication_type === 'altro' && session.communication_details) {
                            return <span className="truncate">{session.communication_details}</span>;
                          }
                          return <span>{type}</span>;
                        }
                        // Fallback per retrocompatibilità
                        return <span className="truncate">{session.location || 'Non specificato'}</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Presenze</p>
                  <p className="text-xs text-muted-foreground truncate">
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
            {/* Convocati */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Convocati
                </CardTitle>
                <CardDescription>
                  Gestisci i giocatori convocati per questa sessione di allenamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionId && players && (
                  <ConvocatiManager 
                    sessionId={sessionId}
                    allPlayers={players}
                    attendance={attendance}
                    key={`convocati-${refreshKey}`}
                  />
                )}
              </CardContent>
            </Card>

            {/* Formazione */}
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
                    key={`lineup-${refreshKey}`} 
                    presentPlayers={players?.filter(player => {
                      const playerAttendance = attendance?.find(a => a.player_id === player.id);
                      return playerAttendance?.status === 'present';
                    }) || []}
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
    </div>
  )
}

export default SessionManagement
