
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import DndGrid from "@/components/Dashboard/DndGrid";
import StatChipBar from "@/components/Dashboard/StatChipBar";
// removed BestWorstCard
import TopLeaderCard from "@/components/Dashboard/TopLeaderCard";
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
  CircleX,
  CalendarDays,
  AlarmClock,
  BadgeCheck,
  Hand,
  SquareMinus,
  SquarePlus
} from "lucide-react";
import { usePlayers, useStats, useRecentActivity, useLeaders, useTeamTrend, useAttendanceDistribution, useTrainingPresenceSeries, useMatchPresenceSeries } from "@/hooks/useSupabaseData";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart as ReBarChart, Bar } from 'recharts'
import { PlayerForm } from "@/components/forms/PlayerForm";
import { useAuth } from "@/contexts/AuthContext";

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
  const { data: trainingSeries } = useTrainingPresenceSeries(30)
  const { data: matchSeries } = useMatchPresenceSeries(10)

  // Helpers to compose best/worst from leaders arrays using players list for avatar/role
  const playerById = new Map<string, any>(players.map((p:any)=>[p.id, p]))
  const pickBestWorst = (arr?: Array<{ player_id: string; value?: number; count?: number; percent?: number; first_name?: string; last_name?: string }>) => {
    if (!arr || arr.length===0) return { best: null, worst: null }
    const withVal = arr.map(r=>({
      player: {
        id: r.player_id,
        first_name: playerById.get(r.player_id)?.first_name || r.first_name || '-',
        last_name: playerById.get(r.player_id)?.last_name || r.last_name || '-',
        avatar_url: playerById.get(r.player_id)?.avatar_url || null,
        role_code: playerById.get(r.player_id)?.role_code || null,
      },
      value: (typeof r.value === 'number' ? r.value : (typeof r.count === 'number' ? r.count : 0)),
      percent: (typeof (r as any).percent === 'number' ? (r as any).percent : undefined)
    }))
    const best = withVal.slice().sort((a,b)=>b.value-a.value)[0] || null
    const worst = withVal.slice().sort((a,b)=>a.value-b.value)[0] || null
    return { best, worst }
  }
  
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
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Panoramica generale del tuo club</p>
        </div>
        {/* Chip actions bar */}
        <div className="mb-6">
          <StatChipBar chips={[
            { label: 'Nuovo allenamento', icon: <Calendar className="h-4 w-4" />, color: 'accent' },
            { label: 'Registra partita', icon: <Trophy className="h-4 w-4" />, color: 'primary' },
            { label: 'Aggiungi giocatore', icon: <Users className="h-4 w-4" />, color: 'success' },
            { label: 'Valuta candidato', icon: <Target className="h-4 w-4" />, color: 'secondary' },
          ]} />
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

        {/* Modular grid with drag-and-drop */}
        <DndGrid
          userId={useAuth().user?.id || null}
          modules={[
            {
              id: 'trend-matches',
              title: 'Trend ultime partite (ultime 10)',
              render: () => (
                <div>
                  <div className="h-64">
                    {trend?.series && trend.series.length > 0 ? (
                      <ChartContainer config={{
                        points: { label: 'Punti', color: 'hsl(var(--primary))' },
                      }} className="h-full">
                        <ReLineChart data={trend.series} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="points" stroke="var(--color-points)" strokeWidth={2} dot={false} />
                        </ReLineChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nessun dato disponibile</div>
                    )}
                  </div>
                  {trend && (
                    <div className="mt-3 text-xs text-muted-foreground break-words">Periodo: ultime 10 partite · Bilancio <span className="text-foreground font-medium">{trend.wdl.wins}V {trend.wdl.draws}N {trend.wdl.losses}P</span></div>
                  )}
                </div>
              )
            },
            {
              id: 'training-series',
              title: 'Presenze allenamenti (ultimi 30 giorni)',
              render: () => (
                <div>
                  <div className="h-64">
                    {trainingSeries?.curr ? (
                      <ChartContainer config={{ presenze: { label: 'Presenze', color: 'hsl(var(--success))' } }} className="h-full">
                        <ReLineChart data={trainingSeries.curr} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="value" name="Presenze" stroke="var(--color-presenze)" strokeWidth={2} dot={false} />
                        </ReLineChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nessun dato disponibile</div>
                    )}
                  </div>
                  {trainingSeries && (
                    <div className="mt-3 text-xs text-muted-foreground break-words">Ultimi 30 giorni · Variazione vs periodo precedente: <span className={trainingSeries.deltaPct >= 0 ? 'text-success' : 'text-destructive'}>{trainingSeries.deltaPct >= 0 ? '+' : ''}{trainingSeries.deltaPct}%</span></div>
                  )}
                </div>
              )
            },
            {
              id: 'match-presences',
              title: 'Presenze partite (ultime 10)',
              render: () => (
                <div>
                  <div className="h-64">
                    {matchSeries?.curr ? (
                      <ChartContainer config={{ presenze: { label: 'Presenze', color: 'hsl(var(--accent))' } }} className="h-full">
                        <ReLineChart data={matchSeries.curr} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="value" name="Presenze" stroke="var(--color-presenze)" strokeWidth={2} dot={false} />
                        </ReLineChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nessun dato disponibile</div>
                    )}
                  </div>
                  {matchSeries && (
                    <div className="mt-3 text-xs text-muted-foreground break-words">Ultime 10 partite · Variazione vs periodo precedente: <span className={matchSeries.deltaPct >= 0 ? 'text-success' : 'text-destructive'}>{matchSeries.deltaPct >= 0 ? '+' : ''}{matchSeries.deltaPct}%</span></div>
                  )}
                </div>
              )
            },
            {
              id: 'attendance-month',
              title: 'Distribuzione presenze mese',
              render: () => (
                <div>
                  <div className="h-64">
                    {attendanceDist ? (
                      <ChartContainer config={{
                        present: { label: 'Presenti', color: 'hsl(var(--success))' },
                        late: { label: 'Ritardi', color: '#f59e0b' },
                        absent: { label: 'Assenti', color: 'hsl(var(--destructive))' },
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
                          <Bar dataKey="pending" fill="var(--color-pending)" />
                          <Bar dataKey="no_response" fill="var(--color-no_response)" />
                        </ReBarChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nessun dato disponibile</div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground break-words">Periodo: mese corrente</div>
                </div>
              )
            },
            {
              id: 'leaders-month',
              title: 'Leader del mese',
              render: () => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TopLeaderCard metricLabel="Presenze allenamenti" valueUnit="presenze" variant="training" item={pickBestWorst(leaders?.trainingPresences).best} />
                  <TopLeaderCard metricLabel="Assenze allenamenti" valueUnit="assenze" variant="lates" item={pickBestWorst(leaders?.trainingAbsences).best} />
                  <TopLeaderCard
                    metricLabel="Ritardi (all. + partite)"
                    valueUnit="ritardi"
                    variant="lates"
                    item={pickBestWorst(leaders?.lates).best}
                  />
                  <TopLeaderCard metricLabel="Ritardi allenamenti" valueUnit="ritardi" variant="lates" item={pickBestWorst(leaders?.trainingLates).best} />
                  <TopLeaderCard metricLabel="Ritardi partite" valueUnit="ritardi" variant="lates" item={pickBestWorst(leaders?.matchLates).best} />
                  <TopLeaderCard metricLabel="Presenze partite" valueUnit="presenze" variant="matches" item={pickBestWorst(leaders?.matchPresences).best} />
                  <TopLeaderCard metricLabel="Assenze partite" valueUnit="assenze" variant="lates" item={pickBestWorst(leaders?.matchAbsences).best} />
                  <TopLeaderCard metricLabel="No response (allenamenti)" valueUnit="no resp." variant="no_response" item={pickBestWorst(leaders?.trainingNoResponses).best} />
                  <TopLeaderCard metricLabel="No response (partite)" valueUnit="no resp." variant="no_response" item={pickBestWorst(leaders?.matchNoResponses).best} />
                  <TopLeaderCard metricLabel="Presenze (all. + partite)" valueUnit="presenze" variant="training" item={pickBestWorst(leaders?.totalPresences).best} />
                  <TopLeaderCard metricLabel="Assenze (all. + partite)" valueUnit="assenze" variant="lates" item={pickBestWorst(leaders?.totalAbsences).best} />
                  <TopLeaderCard
                    metricLabel="No response (all. + partite)"
                    valueUnit="no resp."
                    variant="no_response"
                    item={pickBestWorst(leaders?.noResponses).best}
                  />
                  <TopLeaderCard
                    metricLabel="Gol"
                    valueUnit="gol"
                    variant="goals"
                    item={pickBestWorst(leaders?.goals).best}
                  />
                  <TopLeaderCard
                    metricLabel="Assist"
                    valueUnit="assist"
                    variant="assists"
                    item={pickBestWorst(leaders?.assists).best}
                  />
                  <TopLeaderCard
                    metricLabel="Minuti giocati"
                    valueUnit="min"
                    variant="minutes"
                    item={pickBestWorst(leaders?.minutes).best}
                  />
                  <TopLeaderCard
                    metricLabel="Parate"
                    valueUnit="parate"
                    variant="saves"
                    item={pickBestWorst(leaders?.saves).best}
                  />
                  <TopLeaderCard
                    metricLabel="Ammonizioni"
                    valueUnit="gialli"
                    variant="yellow"
                    item={pickBestWorst(leaders?.yellowCards).best}
                  />
                  <TopLeaderCard
                    metricLabel="Espulsioni"
                    valueUnit="rossi"
                    variant="red"
                    item={pickBestWorst(leaders?.redCards).best}
                  />
                </div>
              )
            },
            {
              id: 'recent-activity',
              title: 'Attività recenti',
              render: () => (
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
              )
            },
          ]}
        />
      </div>
    </div>
  );
};

export default Dashboard;
