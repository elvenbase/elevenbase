import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { TrainingForm } from '@/components/forms/TrainingForm';
import { TrainingSessionModal } from '@/components/forms/TrainingSessionModal';
import StatsCard from '@/components/StatsCard';
import { useTrainingSessions, useTrainingStats, usePlayers } from '@/hooks/useSupabaseData';

const Training = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: trainingSessions, isLoading, refetch: refetchSessions } = useTrainingSessions();
  const { data: stats } = useTrainingStats();
  const { data: players } = usePlayers();

  const handleSessionClosed = () => {
    refetchSessions();
  };

  const openSessionDetails = (session: any) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  const getStatusBadge = (session: any) => {
    if (session.is_closed) {
      return <Badge variant="destructive">Chiusa</Badge>;
    }
    
    const sessionDateTime = new Date(session.session_date + 'T' + session.start_time);
    const now = new Date();
    
    if (sessionDateTime < now) {
      return <Badge variant="secondary">Passata</Badge>;
    } else {
      return <Badge variant="default">Programmata</Badge>;
    }
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
              <Plus className="h-4 w-4" />
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

        {/* Lista Sessioni */}
        <Card>
          <CardHeader>
            <CardTitle>Sessioni di Allenamento</CardTitle>
            <CardDescription>
              Clicca su una sessione per gestire presenze, formazioni e condividere il link pubblico
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
                    <TableHead>Stato</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{session.title}</div>
                          {session.description && (
                            <div className="text-sm text-muted-foreground">{session.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(session.session_date), 'EEEE d MMMM yyyy', { locale: it })}
                      </TableCell>
                      <TableCell>
                        {session.start_time} - {session.end_time}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(session)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSessionDetails(session)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Gestisci
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna sessione trovata</h3>
                <p className="text-muted-foreground mb-4">
                  Inizia creando la tua prima sessione di allenamento
                </p>
                <TrainingForm>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Sessione
                  </Button>
                </TrainingForm>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Dettagli Sessione */}
        <TrainingSessionModal
          session={selectedSession}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSessionClosed={handleSessionClosed}
        />
      </div>
    </div>
  );
};

export default Training;