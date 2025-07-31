import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Calendar, Target, Edit, Trash2 } from "lucide-react";
import { useCompetitions, useCompetitionStats, useMatches } from "@/hooks/useSupabaseData";
import { CompetitionForm } from "@/components/forms/CompetitionForm";
import { MatchForm } from "@/components/forms/MatchForm";

const Competitions = () => {
  const { data: competitions = [] } = useCompetitions();
  const { data: matches = [] } = useMatches();
  const { data: stats } = useCompetitionStats();

  const upcomingMatches = matches
    .filter(match => new Date(match.match_date) >= new Date())
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Competizioni
            </h1>
            <p className="text-muted-foreground">
              Gestione campionati, tornei e partite
            </p>
          </div>
          <CompetitionForm>
            <Button variant="hero" className="space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuova Competizione</span>
            </Button>
          </CompetitionForm>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Campionati</h3>
              <div className="p-2 bg-primary rounded-lg shadow-glow">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.championships || 0}</p>
            <p className="text-sm text-muted-foreground">Attivi</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tornei</h3>
              <div className="p-2 bg-accent rounded-lg shadow-accent-glow">
                <Target className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.tournaments || 0}</p>
            <p className="text-sm text-muted-foreground">In corso</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Partite</h3>
              <div className="p-2 bg-success rounded-lg">
                <Calendar className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.totalMatches || 0}</p>
            <p className="text-sm text-muted-foreground">Totali</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Prossima</h3>
              <div className="p-2 bg-warning rounded-lg">
                <Calendar className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.daysToNext || 0}</p>
            <p className="text-sm text-muted-foreground">Giorni</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Wizard Competizioni</h3>
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
                  <Button variant="outline" size="sm">
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
                  <Button variant="gaming" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Crea Torneo
                  </Button>
                </CompetitionForm>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Prossime Partite</h3>
                <p className="text-sm text-muted-foreground">Match programmati</p>
              </div>
              <div className="flex items-center space-x-2">
                <MatchForm>
                  <Button variant="outline" size="sm">
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
                upcomingMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/80 transition-smooth">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${match.home_away === 'home' ? "bg-accent" : "bg-warning"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.competitions?.name || 'Amichevole'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(match.match_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{match.match_time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Competizioni Attive</h3>
                <p className="text-sm text-muted-foreground">Gestisci le tue competizioni</p>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            
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
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Tutte le Partite</h3>
                <p className="text-sm text-muted-foreground">Cronologia completa</p>
              </div>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Competitions;