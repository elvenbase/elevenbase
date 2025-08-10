import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Calendar, Target, Edit, Trash2, Copy, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useCompetitions, useCompetitionStats, useMatches, useCloneMatch, useDeleteMatch } from "@/hooks/useSupabaseData";
import { CompetitionForm } from "@/components/forms/CompetitionForm";
import { MatchForm } from "@/components/forms/MatchForm";
import { Link } from "react-router-dom";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Competitions = () => {
  const { data: competitions = [] } = useCompetitions();
  const { data: matches = [] } = useMatches();
  const { data: stats } = useCompetitionStats();
  const cloneMatch = useCloneMatch();
  const deleteMatch = useDeleteMatch();
  const onClone = (id: string) => cloneMatch.mutate(id);
  const onDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa partita? L'operazione è irreversibile.")) {
      deleteMatch.mutate(id);
    }
  };
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    const next = new Set(expandedMatches);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedMatches(next);
  };
  const getMatchStatusBadge = (match: any) => {
    if (match.status === 'completed') return <Badge variant="outline">Completata</Badge>;
    const matchDateTime = new Date(match.match_date + 'T' + (match.match_time || '00:00'));
    const now = new Date();
    if (matchDateTime < now) return <Badge variant="secondary">Passata</Badge>;
    return <Badge variant="default">Programmata</Badge>;
  };

  const upcomingMatches = matches
    .filter(match => new Date(match.match_date) >= new Date())
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">
              Competizioni
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestione campionati, tornei e partite
            </p>
          </div>
          <CompetitionForm>
            <Button variant="hero" className="space-x-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span>Nuova Competizione</span>
            </Button>
          </CompetitionForm>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="p-4 sm:p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Campionati</h3>
              <div className="p-2 bg-primary rounded-lg shadow-glow">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.championships || 0}</p>
            <p className="text-sm text-muted-foreground">Attivi</p>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Tornei</h3>
              <div className="p-2 bg-accent rounded-lg shadow-accent-glow">
                <Target className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.tournaments || 0}</p>
            <p className="text-sm text-muted-foreground">In corso</p>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Partite</h3>
              <div className="p-2 bg-success rounded-lg">
                <Calendar className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.totalMatches || 0}</p>
            <p className="text-sm text-muted-foreground">Totali</p>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Prossima</h3>
              <div className="p-2 bg-warning rounded-lg">
                <Calendar className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.daysToNext || 0}</p>
            <p className="text-sm text-muted-foreground">Giorni</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Wizard Competizioni</h3>
                <p className="text-sm text-muted-foreground">Crea nuove competizioni guidato</p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted border-l-4 border-primary">
                <h4 className="font-semibold text-foreground mb-2">Campionato</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Crea un campionato con girone all'italiana, doppio o singolo
                </p>
                <CompetitionForm>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Trophy className="h-4 w-4 mr-2" />
                    Crea Campionato
                  </Button>
                </CompetitionForm>
              </div>
              
              <div className="p-4 rounded-xl bg-muted border-l-4 border-accent">
                <h4 className="font-semibold text-foreground mb-2">Torneo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Organizza un torneo con gironi e fasi eliminatorie
                </p>
                <CompetitionForm>
                  <Button variant="gaming" size="sm" className="w-full sm:w-auto">
                    <Target className="h-4 w-4 mr-2" />
                    Crea Torneo
                  </Button>
                </CompetitionForm>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Prossime Partite</h3>
                <p className="text-sm text-muted-foreground">Match programmati</p>
              </div>
              <div className="flex items-center space-x-2">
                <MatchForm>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Partita
                  </Button>
                </MatchForm>
              </div>
            </div>
            
            <div className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nessuna partita programmata</p>
                </div>
              ) : (
                upcomingMatches.map((match) => {
                  const isExpanded = expandedMatches.has(match.id);
                  const title = `${match.home_away === 'home' ? 'vs' : '@'} ${match.opponent_name}`;
                  return (
                    <div key={match.id} className="rounded-xl bg-muted hover:bg-muted/80 transition-smooth p-3">
                      {/* Header with title and status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className={`mt-1 w-3 h-3 rounded-full ${match.home_away === 'home' ? 'bg-accent' : 'bg-warning'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base sm:text-lg leading-tight truncate" title={title}>{title}</h4>
                              <Badge variant="outline">{match.home_away === 'home' ? 'Casa' : 'Trasferta'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate" title={match.competitions?.name || 'Amichevole'}>
                              {match.competitions?.name || 'Amichevole'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">{getMatchStatusBadge(match)}</div>
                      </div>

                      {/* Date and time */}
                      <div className="mt-3 flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 min-w-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate whitespace-nowrap">{new Date(match.match_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="whitespace-nowrap">{match.match_time}</span>
                        </div>
                      </div>

                      {/* Primary action */}
                      <Link to={`/match/${match.id}`} className="block mt-3">
                        <Button className="w-full bg-gradient-primary text-white hover:opacity-90">
                          <Settings className="h-4 w-4 mr-2 text-white" />
                          Gestisci Partita
                        </Button>
                      </Link>

                      {/* Expand/collapse */}
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpanded(match.id)}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-white hover:text-white"
                      >
                        <span className="text-xs sm:text-sm">{isExpanded ? 'Nascondi opzioni' : 'Mostra altre opzioni'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            {/* Clone */}
                            <Button variant="outline" className="w-full justify-start" onClick={() => onClone(match.id)} disabled={cloneMatch.isPending}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clona Partita
                            </Button>
                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Elimina Partita
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione non può essere annullata. Verranno eliminati eventuali dati collegati alla partita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Tutte le Partite</h3>
                <p className="text-sm text-muted-foreground">Cronologia completa</p>
              </div>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[640px]">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avversario</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nessuna partita registrata
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.slice(0, 5).map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">
                        {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                      </TableCell>
                      <TableCell>
                        {new Date(match.match_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {match.status === 'completed' ? (
                          <Badge variant={
                            (match.our_score || 0) > (match.opponent_score || 0) ? 'default' :
                            (match.our_score || 0) < (match.opponent_score || 0) ? 'destructive' : 'secondary'
                          }>
                            {match.our_score || 0} - {match.opponent_score || 0}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{match.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Competizioni Attive</h3>
                <p className="text-sm text-muted-foreground">Gestisci le tue competizioni</p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[640px]">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nessuna competizione creata
                    </TableCell>
                  </TableRow>
                ) : (
                  competitions.map((competition) => (
                    <TableRow key={competition.id}>
                      <TableCell className="font-medium">{competition.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {competition.type === 'championship' ? 'Campionato' :
                           competition.type === 'tournament' ? 'Torneo' : 'Amichevole'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={competition.is_active ? 'default' : 'outline'}>
                          {competition.is_active ? 'Attiva' : 'Conclusa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
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
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Tutte le Partite</h3>
                <p className="text-sm text-muted-foreground">Cronologia completa</p>
              </div>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[640px]">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avversario</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nessuna partita registrata
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.slice(0, 5).map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">
                        {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                      </TableCell>
                      <TableCell>
                        {new Date(match.match_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {match.status === 'completed' ? (
                          <Badge variant={
                            (match.our_score || 0) > (match.opponent_score || 0) ? 'default' :
                            (match.our_score || 0) < (match.opponent_score || 0) ? 'destructive' : 'secondary'
                          }>
                            {match.our_score || 0} - {match.opponent_score || 0}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{match.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Competitions;