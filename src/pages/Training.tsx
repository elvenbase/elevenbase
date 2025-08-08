import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, Eye, Copy, Trash2, MoreHorizontal, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { TrainingForm } from '@/components/forms/TrainingForm';
import { TrainingSessionModal } from '@/components/forms/TrainingSessionModal';
import { DuplicateTrainingForm } from '@/components/forms/DuplicateTrainingForm';
import StatsCard from '@/components/StatsCard';
import { useTrainingSessions, useTrainingStats, usePlayers, useDeleteTrainingSession } from '@/hooks/useSupabaseData';

interface TrainingSession {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  is_closed: boolean;
  description?: string;
  location?: string;
  max_participants?: number;
  current_participants?: number;
}

const Training = () => {
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  
  const { data: trainingSessions, isLoading, refetch: refetchSessions } = useTrainingSessions();
  const { data: stats } = useTrainingStats();
  const { data: players } = usePlayers();
  const deleteSession = useDeleteTrainingSession();

  const handleSessionClosed = () => {
    refetchSessions();
  };

  const openSessionDetails = (session: TrainingSession) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  const toggleExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleDelete = async (sessionId: string) => {
    await deleteSession.mutateAsync(sessionId);
  };

  // Funzione per determinare se una sessione è archiviata
  const isSessionArchived = (session: TrainingSession) => {
    if (session.is_closed) return true;
    
    const sessionDateTime = new Date(session.session_date + 'T' + session.end_time);
    const now = new Date();
    const hoursSinceEnd = (now.getTime() - sessionDateTime.getTime()) / (1000 * 60 * 60);
    
    // Archivia automaticamente dopo 48 ore dalla fine
    return hoursSinceEnd > 48;
  };

  const getStatusBadge = (session: TrainingSession) => {
    if (session.is_closed) {
      return <Badge variant="destructive">Chiusa</Badge>;
    }
    
    const sessionDateTime = new Date(session.session_date + 'T' + session.start_time);
    const now = new Date();
    
    if (isSessionArchived(session)) {
      return <Badge variant="outline">Archiviata</Badge>;
    } else if (sessionDateTime < now) {
      return <Badge variant="secondary">Passata</Badge>;
    } else {
      return <Badge variant="default">Programmata</Badge>;
    }
  };

  // Separa e ordina le sessioni
  const separatedSessions = trainingSessions ? {
    active: trainingSessions
      .filter(session => !isSessionArchived(session))
      .sort((a, b) => {
        const dateA = new Date(a.session_date + 'T' + a.start_time);
        const dateB = new Date(b.session_date + 'T' + b.start_time);
        const now = new Date();
        
        // Prima le future (più vicine prima), poi le passate (più recenti prima)
        if (dateA >= now && dateB >= now) {
          return dateA.getTime() - dateB.getTime(); // Future: più vicine prima
        } else if (dateA < now && dateB < now) {
          return dateB.getTime() - dateA.getTime(); // Passate: più recenti prima
        } else {
          return dateA >= now ? -1 : 1; // Future prima delle passate
        }
      }),
    archived: trainingSessions
      .filter(session => isSessionArchived(session))
      .sort((a, b) => {
        const dateA = new Date(a.session_date + 'T' + a.start_time);
        const dateB = new Date(b.session_date + 'T' + b.start_time);
        return dateB.getTime() - dateA.getTime(); // Più recenti prima
      })
  } : { active: [], archived: [] };

  // Mobile card component for training sessions
  const TrainingSessionCard = ({ session }: { session: TrainingSession }) => {
    const isExpanded = expandedSessions.has(session.id);
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          {/* Main content - always visible */}
          <div className="space-y-3">
            {/* Header with title and status */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg leading-tight">{session.title}</h3>
                {session.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{session.description}</p>
                )}
              </div>
              <div className="ml-2 sm:ml-3 flex-shrink-0">
                {getStatusBadge(session)}
              </div>
            </div>

            {/* Date and time info */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 min-w-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{format(new Date(session.session_date), 'EEE d MMM', { locale: it })}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{session.start_time}</span>
              </div>
            </div>

            {/* Quick action button */}
            <Link to={`/training/session/${session.id}`} className="block">
              <Button className="w-full bg-gradient-primary text-white hover:opacity-90">
                <Settings className="h-4 w-4 mr-2 text-white" />
                Gestisci Sessione
              </Button>
            </Link>

                          {/* Expand/collapse button */}
              <Button
                variant="ghost"
                onClick={() => toggleExpanded(session.id)}
                className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs sm:text-sm">
                  {isExpanded ? 'Nascondi opzioni' : 'Mostra altre opzioni'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
          </div>

          {/* Expandable section */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {/* Duplicate session */}
                <DuplicateTrainingForm session={session} />
                
                {/* Delete session */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina Sessione
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione non può essere annullata. Verranno eliminati anche tutti i dati delle presenze e delle formazioni collegati a questa sessione.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(session.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Elimina
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Additional session info */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Data completa:</span>
                    <span className="text-right text-xs sm:text-sm break-words">{format(new Date(session.session_date), 'EEEE d MMMM yyyy', { locale: it })}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Orario:</span>
                    <span className="text-xs sm:text-sm">{session.start_time} - {session.end_time}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
              Allenamenti
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestione completa delle sessioni di allenamento
            </p>
          </div>
          <TrainingForm>
            <Button className="w-full sm:w-auto space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuova Sessione</span>
            </Button>
          </TrainingForm>
        </div>

        {/* Statistiche - Optimized for mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
        <div>
          {/* Desktop table view */}
          <div className="hidden lg:block">
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
                ) : separatedSessions.active.length > 0 || separatedSessions.archived.length > 0 ? (
                  <div className="space-y-6">
                    {/* Sessioni Attive */}
                    {separatedSessions.active.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Sessioni Attive</h3>
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
                            {separatedSessions.active.map((session) => (
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Apri menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/training/session/${session.id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Gestisci Sessione
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DuplicateTrainingForm session={session} />
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Elimina Sessione
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Questa azione non può essere annullata. Verranno eliminati anche tutti i dati delle presenze e delle formazioni collegati a questa sessione.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(session.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Elimina
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Sessioni Archiviate */}
                    {separatedSessions.archived.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                          Archiviate ({separatedSessions.archived.length})
                        </h3>
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
                            {separatedSessions.archived.map((session) => (
                              <TableRow key={session.id} className="opacity-75">
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
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Apri menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem asChild>
                                        <Link to={`/training/session/${session.id}`} className="flex items-center">
                                          <Eye className="mr-2 h-4 w-4" />
                                          Visualizza Sessione
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Elimina Sessione
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Questa azione non può essere annullata. Verranno eliminati anche tutti i dati delle presenze e delle formazioni collegati a questa sessione.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDelete(session.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Elimina
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
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
          </div>

          {/* Mobile card view */}
          <div className="lg:hidden">
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-semibold mb-2">Sessioni di Allenamento</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tocca "Gestisci Sessione" per accedere rapidamente alla gestione
              </p>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Caricamento sessioni...</p>
              </div>
            ) : separatedSessions.active.length > 0 || separatedSessions.archived.length > 0 ? (
              <div className="space-y-6">
                {/* Sessioni Attive Mobile */}
                {separatedSessions.active.length > 0 && (
                  <div className="space-y-4">
                    {separatedSessions.active.map((session) => (
                      <TrainingSessionCard key={session.id} session={session} />
                    ))}
                  </div>
                )}

                {/* Sessioni Archiviate Mobile */}
                {separatedSessions.archived.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-muted-foreground">
                        Archiviate ({separatedSessions.archived.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Sessioni chiuse o terminate da più di 48 ore
                      </p>
                    </div>
                    <div className="space-y-4">
                      {separatedSessions.archived.map((session) => (
                        <div key={session.id} className="opacity-75">
                          <TrainingSessionCard session={session} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna sessione trovata</h3>
                <p className="text-muted-foreground mb-4">
                  Inizia creando la tua prima sessione di allenamento
                </p>
                <TrainingForm>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Sessione
                  </Button>
                </TrainingForm>
              </div>
            )}
          </div>
        </div>

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