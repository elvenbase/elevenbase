
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
  Activity,
  Timer,
  UserPlus,
  Shield,
  CircleX
} from "lucide-react";
import { usePlayers, useStats, useRecentActivity, useLeaders, useTeamTrend, useAttendanceDistribution } from "@/hooks/useSupabaseData";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart as ReBarChart, Bar, ResponsiveContainer } from 'recharts'
import { PlayerForm } from "@/components/forms/PlayerForm";

const Dashboard = () => {
  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity();
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth()+1, 0)
  const { data: leaders } = useLeaders({ startDate: start, endDate: end })
  const { data: trend } = useTeamTrend({ limit: 10 })
  const { data: attendanceDist } = useAttendanceDistribution({ startDate: start, endDate: end })
  
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Trend Ultime Partite</h3>
                </div>
                <div className="h-64">
                  {trend?.series && trend.series.length > 0 ? (
                    <ChartContainer config={{
                      points: { label: 'Punti', color: 'hsl(var(--primary))' },
                      goalsFor: { label: 'GF', color: 'hsl(var(--success))' },
                      goalsAgainst: { label: 'GS', color: 'hsl(var(--destructive))' },
                    }} className="h-full">
                      <ReLineChart data={trend.series} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="points" stroke="var(--color-points)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="goalsFor" stroke="var(--color-goalsFor)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="goalsAgainst" stroke="var(--color-goalsAgainst)" strokeWidth={2} dot={false} />
                      </ReLineChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nessun dato disponibile</div>
                  )}
                </div>
                {trend && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Bilancio: <span className="text-foreground font-medium">{trend.wdl.wins}V {trend.wdl.draws}N {trend.wdl.losses}P</span> · GF {trend.totals.goalsFor} · GS {trend.totals.goalsAgainst}
                  </div>
                )}
              </Card>

              <Card className="p-6 bg-card border-border">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Presenze Mese (All.+Partite)</h3>
                </div>
                <div className="h-64">
                  {attendanceDist ? (
                    <ChartContainer config={{
                      present: { label: 'Presenti', color: 'hsl(var(--success))' },
                      late: { label: 'Ritardi', color: '#f59e0b' },
                      absent: { label: 'Assenti', color: 'hsl(var(--destructive))' },
                      excused: { label: 'Giustificati', color: '#64748b' },
                      pending: { label: 'In attesa', color: '#94a3b8' },
                      no_response: { label: 'No response', color: '#a3a3a3' },
                    }} className="h-full">
                      <ReBarChart data={[{ name: 'Allen.', ...attendanceDist.training }, { name: 'Partite', ...attendanceDist.match }]} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="present" fill="var(--color-present)" />
                        <Bar dataKey="late" fill="var(--color-late)" />
                        <Bar dataKey="absent" fill="var(--color-absent)" />
                        <Bar dataKey="excused" fill="var(--color-excused)" />
                        <Bar dataKey="pending" fill="var(--color-pending)" />
                        <Bar dataKey="no_response" fill="var(--color-no_response)" />
                      </ReBarChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nessun dato disponibile</div>
                  )}
                </div>
              </Card>
            </div>
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

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Leader del Mese</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Presenze Allenamento</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.trainingPresences?.[0] ? `${leaders.trainingPresences[0].first_name} ${leaders.trainingPresences[0].last_name} (${leaders.trainingPresences[0].count})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Timer className="h-4 w-4" /> Presenze Partite</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.matchPresences?.[0] ? `${leaders.matchPresences[0].first_name} ${leaders.matchPresences[0].last_name} (${leaders.matchPresences[0].count})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Trophy className="h-4 w-4" /> Gol</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.goals?.[0] ? `${leaders.goals[0].first_name} ${leaders.goals[0].last_name} (${leaders.goals[0].value})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><UserPlus className="h-4 w-4" /> Assist</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.assists?.[0] ? `${leaders.assists[0].first_name} ${leaders.assists[0].last_name} (${leaders.assists[0].value})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Minuti giocati</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.minutes?.[0] ? `${leaders.minutes[0].first_name} ${leaders.minutes[0].last_name} (${leaders.minutes[0].value})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" /> Parate</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.saves?.[0] ? `${leaders.saves[0].first_name} ${leaders.saves[0].last_name} (${leaders.saves[0].value})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" /> Ammonizioni</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.yellowCards?.[0] ? `${leaders.yellowCards[0].first_name} ${leaders.yellowCards[0].last_name} (${leaders.yellowCards[0].value})` : '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><CircleX className="h-4 w-4" /> Espulsioni</div>
                  <div className="text-sm font-medium text-foreground">{leaders?.redCards?.[0] ? `${leaders.redCards[0].first_name} ${leaders.redCards[0].last_name} (${leaders.redCards[0].value})` : '-'}</div>
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
