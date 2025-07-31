import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, Calendar, Users, Clock, CheckCircle, Edit, Trash2 } from "lucide-react";
import { useTrainingSessions, useTrainingStats } from "@/hooks/useSupabaseData";
import { TrainingForm } from "@/components/forms/TrainingForm";
import { AttendanceForm } from "@/components/forms/AttendanceForm";

const Training = () => {
  const { data: sessions = [], isLoading } = useTrainingSessions();
  const { data: stats } = useTrainingStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Allenamenti
            </h1>
            <p className="text-muted-foreground">
              Pianificazione sessioni e gestione presenze
            </p>
          </div>
          <TrainingForm>
            <Button variant="hero" className="space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuova Sessione</span>
            </Button>
          </TrainingForm>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sessioni Mese</h3>
              <div className="p-2 bg-accent rounded-lg shadow-accent-glow">
                <Activity className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.monthlySessions || 0}</p>
            <p className="text-sm text-muted-foreground">Questo mese</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Presenza Media</h3>
              <div className="p-2 bg-success rounded-lg">
                <CheckCircle className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.attendanceRate || 0}%</p>
            <p className="text-sm text-muted-foreground">Media presenze</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Prossima</h3>
              <div className="p-2 bg-warning rounded-lg">
                <Clock className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.nextSession ? 
                new Date(stats.nextSession.session_date).toLocaleDateString() === new Date().toLocaleDateString() 
                  ? 'Oggi' 
                  : new Date(stats.nextSession.session_date).toLocaleDateString()
                : 'N/A'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {stats?.nextSession?.start_time || 'Nessuna sessione'}
            </p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Giocatori Attesi</h3>
              <div className="p-2 bg-primary rounded-lg shadow-glow">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">22</p>
            <p className="text-sm text-muted-foreground">Su 24 totali</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Sessioni di Allenamento</h3>
                  <p className="text-sm text-muted-foreground">Tutte le sessioni programmate</p>
                </div>
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Orario</TableHead>
                    <TableHead>Luogo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Caricamento...
                      </TableCell>
                    </TableRow>
                  ) : sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Nessuna sessione programmata
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {new Date(session.session_date).toLocaleDateString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {session.start_time} - {session.end_time}
                        </TableCell>
                        <TableCell>
                          {session.location || 'Non specificato'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <AttendanceForm 
                              sessionId={session.id} 
                              sessionTitle={session.title}
                            >
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </AttendanceForm>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Presenze Rapide</h3>
                <p className="text-sm text-muted-foreground">Sessione corrente</p>
              </div>
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            
            <div className="space-y-4">
              {stats?.nextSession && 
               new Date(stats.nextSession.session_date).toLocaleDateString() === new Date().toLocaleDateString() ? (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <h4 className="font-semibold text-foreground mb-2">{stats.nextSession.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {stats.nextSession.start_time}
                  </p>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-sm text-success">Sessione di oggi</span>
                  </div>
                  <AttendanceForm 
                    sessionId={stats.nextSession.id} 
                    sessionTitle={stats.nextSession.title}
                  >
                    <Button variant="gaming" size="sm" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Gestisci Presenze
                    </Button>
                  </AttendanceForm>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted border border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    Nessuna sessione programmata per oggi
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted">
                  <p className="text-xl font-bold text-success">-</p>
                  <p className="text-xs text-muted-foreground">Presenti</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <p className="text-xl font-bold text-warning">-</p>
                  <p className="text-xs text-muted-foreground">Ritardi</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <p className="text-xl font-bold text-destructive">-</p>
                  <p className="text-xs text-muted-foreground">Assenti</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Training;