import StatsCard from "@/components/StatsCard";
import QuickActions from "@/components/QuickActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Trophy, 
  Calendar, 
  Target,
  TrendingUp,
  Medal,
  Clock,
  Activity
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Panoramica generale delle attività del Ca De Rissi SG Esport
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Giocatori Attivi"
            value="24"
            description="Rosa completa"
            icon={Users}
            trend={{ value: 8.5, isPositive: true }}
          />
          <StatsCard
            title="Partite Giocate"
            value="18"
            description="Questa stagione"
            icon={Trophy}
            trend={{ value: 12.3, isPositive: true }}
          />
          <StatsCard
            title="Prossimo Match"
            value="3"
            description="giorni rimanenti"
            icon={Calendar}
          />
          <StatsCard
            title="Trialist Attivi"
            value="7"
            description="In valutazione"
            icon={Target}
            trend={{ value: 2.1, isPositive: false }}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Recent Activity & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Attività Recenti</h3>
                <p className="text-sm text-muted-foreground">Ultime azioni sul sistema</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              {[
                {
                  action: "Nuovo giocatore aggiunto",
                  detail: "Marco Rossi - Centrocampista",
                  time: "2 ore fa",
                  type: "success"
                },
                {
                  action: "Risultato match inserito",
                  detail: "Ca De Rissi 3-1 Team Alpha",
                  time: "1 giorno fa",
                  type: "info"
                },
                {
                  action: "Trialist promosso",
                  detail: "Luca Bianchi → Rosa principale",
                  time: "2 giorni fa",
                  type: "success"
                },
                {
                  action: "Allenamento completato",
                  detail: "Sessione tecnica - 18 presenti",
                  time: "3 giorni fa",
                  type: "info"
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === "success" ? "bg-success" : "bg-accent"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Prossimi Eventi</h3>
                <p className="text-sm text-muted-foreground">Calendario settimanale</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              {[
                {
                  title: "Allenamento Tecnico",
                  date: "Oggi",
                  time: "20:00",
                  type: "training",
                  priority: "high"
                },
                {
                  title: "Match vs Team Beta",
                  date: "Venerdì 1 Feb",
                  time: "21:00",
                  type: "match",
                  priority: "high"
                },
                {
                  title: "Valutazione Trialist",
                  date: "Sabato 2 Feb",
                  time: "19:00",
                  type: "evaluation",
                  priority: "medium"
                },
                {
                  title: "Allenamento Tattico",
                  date: "Domenica 3 Feb",
                  time: "20:30",
                  type: "training",
                  priority: "medium"
                }
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/80 transition-smooth">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.type === "match" ? "bg-destructive" :
                      event.type === "training" ? "bg-accent" : "bg-warning"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date} • {event.time}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    event.priority === "high" ? "bg-destructive" : "bg-warning"
                  }`} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Prestazioni Stagione</h3>
              <p className="text-sm text-muted-foreground">Riepilogo risultati 2024/2025</p>
            </div>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Dettagli
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted">
              <Medal className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Vittorie</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted">
              <div className="h-8 w-8 bg-warning rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-sm font-bold text-background">=</span>
              </div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-sm text-muted-foreground">Pareggi</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted">
              <div className="h-8 w-8 bg-destructive rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">X</span>
              </div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-sm text-muted-foreground">Sconfitte</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted">
              <div className="h-8 w-8 bg-accent rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-sm font-bold text-accent-foreground">%</span>
              </div>
              <p className="text-2xl font-bold text-foreground">89%</p>
              <p className="text-sm text-muted-foreground">Presenze</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;