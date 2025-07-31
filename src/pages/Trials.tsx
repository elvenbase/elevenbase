import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Trophy, Star } from "lucide-react";
import { useTrialists, useTrialistStats } from "@/hooks/useSupabaseData";
import { TrialistForm } from "@/components/forms/TrialistForm";

const Trials = () => {
  const { data: trialistStats, isLoading } = useTrialistStats();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Prove
            </h1>
            <p className="text-muted-foreground">
              Gestione trialist e processo di valutazione
            </p>
          </div>
          <TrialistForm>
            <Button variant="hero" className="space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Nuovo Trialist</span>
            </Button>
          </TrialistForm>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">In Prova</h3>
              <div className="p-2 bg-warning rounded-lg">
                <UserPlus className="h-4 w-4 text-warning-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? '...' : trialistStats?.inTrial || 0}
            </p>
            <p className="text-sm text-muted-foreground">Trialist attivi</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Promossi</h3>
              <div className="p-2 bg-success rounded-lg">
                <Trophy className="h-4 w-4 text-success-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? '...' : trialistStats?.promoted || 0}
            </p>
            <p className="text-sm text-muted-foreground">Totale promossi</p>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Valutazione Media</h3>
              <div className="p-2 bg-accent rounded-lg">
                <Star className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? '...' : trialistStats?.averageRating > 0 ? trialistStats.averageRating : '-'}
            </p>
            <p className="text-sm text-muted-foreground">Su 5 stelle</p>
          </Card>
        </div>

        <Card className="p-8 bg-card border-border text-center">
          <div className="max-w-md mx-auto">
            <div className="p-6 bg-gradient-accent rounded-2xl shadow-accent-glow mb-6 inline-block">
              <Users className="h-12 w-12 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Sistema Prove Kanban
            </h3>
            <p className="text-muted-foreground mb-6">
              Vista Kanban per gestire il processo di valutazione trialist:
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full" />
                <span className="text-sm">Colonna "In Prova" - Trialist attivi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-sm">Colonna "Promossi" - Accettati in rosa</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-sm">Colonna "Archiviati" - Non selezionati</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-sm">Drag & Drop tra colonne</span>
              </div>
            </div>
            <Button 
              variant="gaming"
              onClick={() => window.location.href = '/trials-kanban'}
            >
              <Star className="h-4 w-4 mr-2" />
              Visualizza Kanban
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Trials;