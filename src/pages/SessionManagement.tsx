
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Calendar, Clock, MapPin, Users, Target, ArrowLeft, Settings, Share } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useTrainingSessions, useTrainingAttendance, usePlayers, useTrainingTrialistInvites } from '@/hooks/useSupabaseData'

import { useLineupManager } from '@/hooks/useLineupManager'
import { AttendanceForm } from '@/components/forms/AttendanceForm'
import { TrainingForm } from '@/components/forms/TrainingForm'
import LineupManager from '@/components/LineupManager'
import { ConvocatiManager } from '@/components/ConvocatiManager'
import PublicLinkSharing from '@/components/PublicLinkSharing'
import { Checkbox } from '@/components/ui/checkbox'

import { toast } from 'sonner'



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
  const [playersInLineup, setPlayersInLineup] = useState<string[]>([])
  const [includeTrialistsInLineup] = useState(true)
  
  const { data: sessions, isLoading: loadingSessions } = useTrainingSessions()
  const { data: attendance, isLoading: loadingAttendance } = useTrainingAttendance(sessionId!)
  const { data: trialistInvites = [] } = useTrainingTrialistInvites(sessionId!)
  const { data: players, error: playersError, isLoading: loadingPlayers } = usePlayers()


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

  const handleLineupChange = useCallback((playerIds: string[]) => {
    setPlayersInLineup(playerIds)
  }, [])

  // 🔧 FIX: Controlli condizionali DOPO tutti gli hooks per evitare "Rendered more hooks than during the previous render"
  
  // Gestione errori players
  if (playersError) {
    console.error('Players fetch error details:', playersError)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Errore caricamento giocatori</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Non è possibile caricare l'elenco dei giocatori. Controlla la connessione e riprova.
            </p>
            <Button onClick={() => window.location.reload()}>
              Ricarica pagina
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state per players
  if (loadingPlayers || loadingSessions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Caricamento sessione...</p>
          </CardContent>
        </Card>
      </div>
    )
  }



  // Calcola statistiche presenze
  const attendanceStats = (() => {
    const playerPresent = attendance?.filter(a => a.status === 'present').length || 0
    const playerAbsent = attendance?.filter(a => a.status === 'absent').length || 0
    const trialistPresent = trialistInvites.filter((t: any) => t.status === 'present').length
    const trialistAbsent = trialistInvites.filter((t: any) => t.status === 'absent').length
    const present = playerPresent + trialistPresent
    const absent = playerAbsent + trialistAbsent
    const totalEntities = (players?.length || 0) + trialistInvites.length
    const responded = (attendance?.length || 0) + trialistPresent + trialistAbsent
    const noResponse = Math.max(0, totalEntities - responded)
    return { present, absent, noResponse, totalPlayers: totalEntities }
  })()

  // Liste per debug e selezione formazione
  let presentPlayersList: any[] = []
  try {
    presentPlayersList = (players?.filter(player => {
      const playerAttendance = attendance?.find(a => a.player_id === player.id);
      return playerAttendance?.status === 'present';
    }) || [])
  } catch (e) {
    console.error('SessionManagement presentPlayersList compute error:', e)
    presentPlayersList = []
  }

  let presentTrialists: any[] = []
  try {
    presentTrialists = (trialistInvites as any[]).filter((t: any) => t.status === 'present')
  } catch (e) {
    console.error('SessionManagement presentTrialists compute error:', e)
    presentTrialists = []
  }

  let trialistsAsPlayers: any[] = []
  try {
    trialistsAsPlayers = presentTrialists.map((t: any) => ({
      id: t.trialist_id as string,
      first_name: (t.trialists?.first_name as string) || 'Trialist',
      last_name: (t.trialists?.last_name as string) || '',
      position: undefined,
      avatar_url: undefined,
      isTrialist: true
    }))
  } catch (e) {
    console.error('SessionManagement trialistsAsPlayers compute error:', e)
    trialistsAsPlayers = []
  }

  const presentPlayersForLineup = includeTrialistsInLineup
    ? [...presentPlayersList, ...trialistsAsPlayers]
    : presentPlayersList

  // Precompute bench lists to avoid inline IIFEs in render
  let trialistAttendanceForBench: any[] = []
  let attendanceForBench: any = attendance
  let trialistsAsPlayersForBench: any[] = []
  let allPlayersForBench: any = players
  try {
    trialistAttendanceForBench = includeTrialistsInLineup
      ? (presentTrialists as any[]).map((t: any) => ({ id: `trialist-${t.trialist_id}`, player_id: t.trialist_id as string, status: 'present' }))
      : []
    attendanceForBench = includeTrialistsInLineup
      ? ([...(attendance || []), ...trialistAttendanceForBench] as any)
      : attendance
    trialistsAsPlayersForBench = includeTrialistsInLineup
      ? (presentTrialists as any[]).map((t: any) => ({
          id: t.trialist_id as string,
          first_name: (t.trialists?.first_name as string) || 'Trialist',
          last_name: (t.trialists?.last_name as string) || '',
          position: undefined,
          avatar_url: undefined,
          status: 'active' as const,
          isTrialist: true,
        }))
      : []
    allPlayersForBench = includeTrialistsInLineup
      ? ([...(players || []), ...trialistsAsPlayersForBench] as any)
      : players
  } catch (e) {
    console.error('SessionManagement bench compute error:', e)
    trialistAttendanceForBench = []
    attendanceForBench = attendance || []
    trialistsAsPlayersForBench = []
    allPlayersForBench = players || []
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
                

                <div className="overflow-x-hidden">
                  {sessionId && (
                    <LineupManager 
                      sessionId={sessionId} 
                      key={`lineup-${refreshKey}`} 
                      presentPlayers={presentPlayersForLineup}
                      onLineupChange={handleLineupChange}
                    />
                  )}
                </div>
                
                {/* Panchina - appare solo con formazione completa */}
                {sessionId && players && playersInLineup.length === 11 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Panchina
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gestisci i giocatori in panchina per questa sessione di allenamento
                      </p>
                    </div>
                    <ConvocatiManager 
                      sessionId={sessionId}
                      allPlayers={allPlayersForBench as any}
                      attendance={attendanceForBench as any}
                      playersInLineup={playersInLineup}
                      key={`convocati-${refreshKey}`}
                    />
                  </div>
                )}
                
                {/* Messaggio quando formazione non è completa */}
                {playersInLineup.length < 11 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Completa la formazione</h3>
                      <p className="text-muted-foreground">
                        Seleziona tutti gli 11 titolari ({playersInLineup.length}/11) per accedere alla gestione della panchina
                      </p>
                    </div>
                  </div>
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
