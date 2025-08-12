
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
import { usePlayers, useStats, useRecentActivity } from "@/hooks/useSupabaseData";
import { PlayerForm } from "@/components/forms/PlayerForm";

const Dashboard = () => {
  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity();
  
  // Debug logging
  console.log('Dashboard Debug:', {
    players: players,
    playersCount: players.length,
    playersLoading,
    stats,
    statsLoading,
    recentActivity,
    activityLoading
  });
  
  const activePlayers = players.filter(player => player.status === 'active');
  const totalPlayers = activePlayers.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Panoramica generale del tuo club
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
            value={stats?.trainingSessions || 0}
            description="Programmati"
            icon={Calendar}
            className="border-l-4 border-l-secondary"
          />
          <StatsCard
            title="Competizioni"
            value={stats?.activeCompetitions || 0}
            description="In corso"
            icon={Trophy}
            className="border-l-4 border-l-accent"
          />
          <StatsCard
            title="Provini"
            value={stats?.activeTrials || 0}
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
                <PlayerForm>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Gestisci Rosa
                  </Button>
                </PlayerForm>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activePlayers.slice(0, 10).map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-foreground">
                      {player.first_name} {player.last_name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                        Attivo
                      </span>
                      {player.jersey_number && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          #{player.jersey_number}
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
                {activityLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'player' ? 'bg-success' :
                        activity.type === 'training' ? 'bg-primary' :
                        activity.type === 'competition' ? 'bg-accent' :
                        'bg-secondary'
                      }`} />
                      <span className="text-sm text-foreground">{activity.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-muted rounded-full" />
                    <span className="text-sm text-muted-foreground">Nessuna attività recente</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
