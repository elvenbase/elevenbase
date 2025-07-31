import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Filter, Search } from "lucide-react";

const Squad = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Rosa
            </h1>
            <p className="text-muted-foreground">
              Gestione giocatori e composizione squadra
            </p>
          </div>
          <Button variant="hero" className="space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Aggiungi Giocatore</span>
          </Button>
        </div>

        <Card className="p-8 bg-card border-border text-center">
          <div className="max-w-md mx-auto">
            <div className="p-6 bg-gradient-primary rounded-2xl shadow-glow mb-6 inline-block">
              <Users className="h-12 w-12 text-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Gestione Rosa in Sviluppo
            </h3>
            <p className="text-muted-foreground mb-6">
              Il modulo di gestione rosa è in fase di sviluppo. Presto potrai:
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-sm">Aggiungere e modificare giocatori</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-sm">Gestire posizioni e numeri di maglia</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-sm">Filtrare per ruolo e stato</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-sm">Importazione batch da CSV</span>
              </div>
            </div>
            <div className="flex space-x-3 justify-center">
              <Button variant="gaming">
                <Search className="h-4 w-4 mr-2" />
                Ricerca
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtri
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Squad;