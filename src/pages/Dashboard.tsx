
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import QuickActions from "@/components/QuickActions";
import { 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp,
  Clock,
  Target,
  Award,
  Activity
} from "lucide-react";
import { players } from "@/data/players";

const Dashboard = () => {
  const activePlayers = players.filter(player => player.status === 'active');
  const totalPlayers = activePlayers.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Panoramica generale del club Ca De Rissi SG Esport
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Giocatori Attivi"
            value={totalPlayers}
            description="Rosa principale"
            icon={Users}
            className="border-l-4 border-l-primary"
          />
          <StatsCard
            title="Allenamenti"
            value="0"
            description="Programmati"
            icon={Calendar}
            className="border-l-4 border-l-secondary"
          />
          <StatsCard
            title="Competizioni"
            value="0"
            description="In corso"
            icon={Trophy}
            className="border-l-4 border-l-accent"
          />
          <StatsCard
            title="Prove"
            value="0"
            description="Programmate"
            icon={Target}
            className="border-l-4 border-l-success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">Rosa Giocatori</h3>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Gestisci Rosa
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activePlayers.slice(0, 10).map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-foreground">
                      {player.firstName} {player.lastName}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                        Attivo
                      </span>
                      {player.jerseyNumber && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          #{player.jerseyNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {totalPlayers > 10 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      e altri {totalPlayers - 10} giocatori...
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <QuickActions />
            
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Attività Recenti</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-sm text-foreground">Rosa aggiornata con {totalPlayers} giocatori</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-foreground">Sistema di gestione inizializzato</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm text-foreground">Dashboard configurata</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
