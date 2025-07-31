import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, Calendar, Target } from "lucide-react";

const Competitions = () => {
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
          <Button variant="hero" className="space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuova Competizione</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Campionati</h3>
              <div className="p-2 bg-primary rounded-lg shadow-glow">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">2</p>
            <p className="text-sm text-muted-foreground">Attivi</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tornei</h3>
              <div className="p-2 bg-accent rounded-lg shadow-accent-glow">
                <Target className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">1</p>
            <p className="text-sm text-muted-foreground">In corso</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Partite</h3>
              <div className="p-2 bg-success rounded-lg">
                <Calendar className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">18</p>
            <p className="text-sm text-muted-foreground">Stagione corrente</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Prossima</h3>
              <div className="p-2 bg-warning rounded-lg">
                <Calendar className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">3</p>
            <p className="text-sm text-muted-foreground">Giorni</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Button variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Crea Campionato
                </Button>
              </div>
              
              <div className="p-4 rounded-xl bg-muted border-l-4 border-accent">
                <h4 className="font-semibold text-foreground mb-2">Torneo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Organizza un torneo con gironi e fasi eliminatorie
                </p>
                <Button variant="gaming" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Crea Torneo
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Calendario Partite</h3>
                <p className="text-sm text-muted-foreground">Prossimi match programmati</p>
              </div>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            
            <div className="space-y-3">
              {[
                {
                  opponent: "Team Alpha",
                  date: "Ven 1 Feb",
                  time: "21:00",
                  competition: "Serie A E-Sports",
                  isHome: true
                },
                {
                  opponent: "Gaming Heroes",
                  date: "Dom 3 Feb", 
                  time: "20:30",
                  competition: "Coppa Italia",
                  isHome: false
                },
                {
                  opponent: "Cyber Warriors",
                  date: "Mer 6 Feb",
                  time: "21:30",
                  competition: "Serie A E-Sports", 
                  isHome: true
                }
              ].map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/80 transition-smooth">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${match.isHome ? "bg-accent" : "bg-warning"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {match.isHome ? "vs" : "@"} {match.opponent}
                      </p>
                      <p className="text-xs text-muted-foreground">{match.competition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{match.date}</p>
                    <p className="text-xs text-muted-foreground">{match.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Competitions;