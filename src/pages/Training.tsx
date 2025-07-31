import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import { AttendanceForm } from '@/components/forms/AttendanceForm';
import { TrainingForm } from '@/components/forms/TrainingForm';
import LineupManager from '@/components/LineupManager';
import PublicLinkSharing from '@/components/PublicLinkSharing';
import { useTrainingSessions, useTrainingStats, usePlayers, useTrainingAttendance } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Edit, Clock, MapPin, Users, Calendar, Share2, Settings } from 'lucide-react';

const Training = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: trainingSessions, isLoading, refetch: refetchSessions } = useTrainingSessions();
  const { data: stats } = useTrainingStats();
  const { data: players } = usePlayers();

  const handleSessionClosed = () => {
    setRefreshKey(prev => prev + 1);
    refetchSessions();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Allenamenti
            </h1>
            <p className="text-muted-foreground">
              Gestione completa delle sessioni di allenamento
            </p>
          </div>
          <TrainingForm>
            <Button className="space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Nuova Sessione</span>
            </Button>
          </TrainingForm>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Sessioni Mese"
            value={stats?.monthlySessions || 0}
            icon={Calendar}
            description="Questo mese"
          />
          <StatsCard
            title="Presenza Media"
            value={`${stats?.attendanceRate || 0}%`}
            icon={Users}
            description="Media presenze"
          />
          <StatsCard
            title="Prossima"
            value={stats?.nextSession ? 
              new Date(stats.nextSession.session_date).toLocaleDateString() === new Date().toLocaleDateString() 
                ? 'Oggi' 
                : new Date(stats.nextSession.session_date).toLocaleDateString()
              : 'N/A'
            }
            icon={Clock}
            description={stats?.nextSession?.start_time || 'Nessuna sessione'}
          />
          <StatsCard
            title="Giocatori Attivi"
            value={players?.filter(p => p.status === 'active').length || 0}
            icon={Users}
            description="Totale squadra"
          />
        </div>

        {/* Gestione Sessioni */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sessions">Sessioni</TabsTrigger>
            <TabsTrigger value="lineup">Formazioni</TabsTrigger>
            <TabsTrigger value="public-link">Link Pubblico</TabsTrigger>
            <TabsTrigger value="quick-attendance">Presenze Rapide</TabsTrigger>
          </TabsList>

          {/* Sessioni Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Sessioni di Allenamento</CardTitle>
                <CardDescription>
                  Gestisci le sessioni di allenamento e le presenze
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Caricamento sessioni...</p>
                  </div>
                ) : trainingSessions && trainingSessions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titolo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Orario</TableHead>
                        <TableHead>Luogo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.title}</TableCell>
                          <TableCell>
                            {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: it })}
                          </TableCell>
                          <TableCell>
                            {session.start_time} - {session.end_time}
                          </TableCell>
                          <TableCell>{session.location || 'Non specificato'}</TableCell>
                          <TableCell>
                            <Badge variant={session.is_closed ? "destructive" : "default"}>
                              {session.is_closed ? 'Chiusa' : 'Aperta'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <AttendanceForm 
                                sessionId={session.id} 
                                sessionTitle={session.title}
                                sessionClosed={session.is_closed}
                                onSessionClosed={handleSessionClosed}
                              >
                                <Button variant="outline" size="sm">
                                  Gestisci Presenze
                                </Button>
                              </AttendanceForm>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedSessionId(session.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Nessuna sessione trovata</h3>
                    <p className="text-muted-foreground">Inizia creando la tua prima sessione di allenamento.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formazioni Tab */}
          <TabsContent value="lineup">
            {selectedSessionId ? (
              <LineupManagerTab 
                sessionId={selectedSessionId} 
                players={players} 
                refreshKey={refreshKey}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Seleziona una sessione</h3>
                    <p className="text-muted-foreground">
                      Clicca sull'icona formazione nella tabella sessioni per iniziare.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Link Pubblico Tab */}
          <TabsContent value="public-link">
            {selectedSessionId ? (
              <PublicLinkTab 
                sessionId={selectedSessionId} 
                trainingSessions={trainingSessions}
                refreshKey={refreshKey}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Share2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Seleziona una sessione</h3>
                    <p className="text-muted-foreground">
                      Seleziona una sessione per gestire il link pubblico di registrazione.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Presenze Rapide Tab */}
          <TabsContent value="quick-attendance">
            <QuickAttendanceTab trainingSessions={trainingSessions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Componente per gestire le formazioni di una sessione specifica
const LineupManagerTab = ({ 
  sessionId, 
  players, 
  refreshKey 
}: { 
  sessionId: string; 
  players: any[]; 
  refreshKey: number;
}) => {
  const { data: attendance } = useTrainingAttendance(sessionId);
  
  // Filtra solo i giocatori presenti
  const presentPlayers = players?.filter(player => {
    const playerAttendance = attendance?.find(a => a.player_id === player.id);
    return playerAttendance?.status === 'present';
  }) || [];

  return (
    <LineupManager 
      sessionId={sessionId} 
      presentPlayers={presentPlayers}
      key={`${sessionId}-${refreshKey}`}
    />
  );
};

// Componente per gestire il link pubblico di una sessione
const PublicLinkTab = ({ 
  sessionId, 
  trainingSessions,
  refreshKey 
}: { 
  sessionId: string; 
  trainingSessions: any[];
  refreshKey: number;
}) => {
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    noResponse: 0,
    totalPlayers: 0
  });

  const { data: players } = usePlayers();
  const { data: attendance, refetch: refetchAttendance } = useTrainingAttendance(sessionId);

  const session = trainingSessions?.find(s => s.id === sessionId);

  useEffect(() => {
    if (players && attendance) {
      const present = attendance.filter(a => a.status === 'present').length;
      const absent = attendance.filter(a => a.status === 'absent').length;
      const totalPlayers = players.filter(p => p.status === 'active').length;
      const noResponse = totalPlayers - attendance.length;

      setAttendanceStats({
        present,
        absent,
        noResponse,
        totalPlayers
      });
    }
  }, [players, attendance, refreshKey]);

  const handleRefresh = () => {
    refetchAttendance();
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Sessione non trovata</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PublicLinkSharing 
      session={session} 
      attendanceStats={attendanceStats}
      onRefresh={handleRefresh}
    />
  );
};

// Componente per le presenze rapide
const QuickAttendanceTab = ({ trainingSessions }: { trainingSessions: any[] }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaySession = trainingSessions?.find(session => session.session_date === today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Presenze Rapide
        </CardTitle>
        <CardDescription>
          Registra velocemente le presenze per la sessione di oggi
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todaySession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <h4 className="font-semibold">{todaySession.title}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {todaySession.start_time} - {todaySession.end_time}
                  </div>
                  {todaySession.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {todaySession.location}
                    </div>
                  )}
                  <Badge variant={todaySession.is_closed ? "destructive" : "default"}>
                    {todaySession.is_closed ? 'Chiusa' : 'Aperta'}
                  </Badge>
                </div>
              </div>
              <AttendanceForm 
                sessionId={todaySession.id} 
                sessionTitle={todaySession.title}
                sessionClosed={todaySession.is_closed}
              >
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Gestisci Presenze
                </Button>
              </AttendanceForm>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2" />
            <p>Nessuna sessione programmata per oggi</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Training;