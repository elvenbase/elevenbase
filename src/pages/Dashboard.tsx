
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import DndGrid from "@/components/Dashboard/DndGrid";
// removed BestWorstCard
import TopLeaderCard from "@/components/Dashboard/TopLeaderCard";
import PlayersStatsTable from "@/components/Dashboard/PlayersStatsTable";
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
import { TrainingForm } from "@/components/forms/TrainingForm";
import { MatchForm } from "@/components/forms/MatchForm";
import { TrialistForm } from "@/components/forms/TrialistForm";
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

  const formatDayMonth = (value: any) => {
    try {
      if (!value) return ''
      // Support ISO strings (YYYY-MM-DD or with time)
      const d = new Date(typeof value === 'string' ? value : String(value))
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      }
      // Fallback: try to parse YYYY-MM-DD manually
      const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (m) return `${m[3]}/${m[2]}`
      return String(value)
    } catch {
      return String(value)
    }
  }

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
        jersey_number: playerById.get(r.player_id)?.jersey_number ?? null,
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
        {/* Chip actions bar (apre direttamente i moduli) */}
        <div className="mb-6 -mx-2 sm:mx-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-2 sm:px-0">
            <TrainingForm>
              <Button
                variant="ghost"
                className="rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-bounce border bg-accent text-accent-foreground hover:scale-105 active:scale-95"
                title="Nuovo allenamento"
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">Nuovo allenamento</span>
                </span>
              </Button>
            </TrainingForm>

            <MatchForm>
              <Button
                variant="ghost"
                className="rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-bounce border bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                title="Registra partita"
              >
                <span className="inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">Registra partita</span>
                </span>
              </Button>
            </MatchForm>

            <PlayerForm>
              <Button
                variant="ghost"
                className="rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-bounce border bg-success text-success-foreground hover:scale-105 active:scale-95"
                title="Aggiungi giocatore"
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">Aggiungi giocatore</span>
                </span>
              </Button>
            </PlayerForm>

            <TrialistForm>
              <Button
                variant="ghost"
                className="rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-bounce border bg-secondary text-secondary-foreground hover:scale-105 active:scale-95"
                title="Valuta candidato"
              >
                <span className="inline-flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">Valuta candidato</span>
                </span>
              </Button>
            </TrialistForm>
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Giocatori Attivi"
            value={activePlayers.length}
            icon={Users}
            description="Giocatori attualmente attivi"
          />
          <StatsCard
            title="Allenamenti"
            value={stats?.trainingSessions || 0}
            icon={Calendar}
            description="Eventi di allenamento nel periodo"
          />
          <StatsCard
            title="Partite"
            value={stats?.activeCompetitions || 0}
            icon={Trophy}
            description="Eventi partita nel periodo"
          />
          <StatsCard
            title="Allenatori"
            value={stats?.activeTrials || 0}
            icon={Shield}
            description="Coach registrati"
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
                        <ReLineChart data={trend.series} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
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
                        <ReLineChart data={trainingSeries.curr} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
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
                        <ReLineChart data={matchSeries.curr} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
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
                        <ReBarChart data={[{ name: 'Allen.', ...attendanceDist.training }, { name: 'Partite', ...attendanceDist.match }]} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent className="text-[9px] sm:text-xs" />} />
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
                  <div className="mt-3 text-xs text-muted-foreground">Periodo: mese corrente</div>
                </div>
              )
            },
            {
              id: 'leaders-training-presences',
              title: 'Presenze Allenamenti',
              gridClassName: 'col-span-1',
              render: () => (
                <div className="grid grid-cols-1 min-[800px]:grid-cols-3 min-[1500px]:grid-cols-4 gap-4 justify-items-center">
                  <TopLeaderCard metricLabel="Presenze allenamenti" valueUnit="presenze" variant="training" item={pickBestWorst(leaders?.trainingPresences).best} distribution={leaders?.trainingPresences} />
                  <TopLeaderCard metricLabel="Assenze allenamenti" valueUnit="assenze" item={pickBestWorst(leaders?.trainingAbsences).best} distribution={leaders?.trainingAbsences} />
                  <TopLeaderCard metricLabel="Ritardi allenamenti" valueUnit="ritardi" variant="lates" item={pickBestWorst(leaders?.trainingLates).best} distribution={leaders?.trainingLates} />
                  <TopLeaderCard metricLabel="No response (allenamenti)" valueUnit="no resp." variant="no_response" item={pickBestWorst(leaders?.trainingNoResponses).best} distribution={leaders?.trainingNoResponses} />
                </div>
              )
            },
            {
              id: 'leaders-match-presences',
              title: 'Presenze Partite',
              gridClassName: 'col-span-1',
              render: () => (
                <div className="grid grid-cols-1 min-[800px]:grid-cols-3 min-[1500px]:grid-cols-4 gap-4 justify-items-center">
                  <TopLeaderCard metricLabel="Presenze partite" valueUnit="presenze" variant="matches" item={pickBestWorst(leaders?.matchPresences).best} distribution={leaders?.matchPresences} />
                  <TopLeaderCard metricLabel="Assenze partite" valueUnit="assenze" item={pickBestWorst(leaders?.matchAbsences).best} distribution={leaders?.matchAbsences} />
                  <TopLeaderCard metricLabel="Ritardi partite" valueUnit="ritardi" variant="lates" item={pickBestWorst(leaders?.matchLates).best} distribution={leaders?.matchLates} />
                  <TopLeaderCard metricLabel="No response (partite)" valueUnit="no resp." variant="no_response" item={pickBestWorst(leaders?.matchNoResponses).best} distribution={leaders?.matchNoResponses} />
                </div>
              )
            },
            {
              id: 'leaders-total-presences',
              title: 'Presenze Totali',
              gridClassName: 'col-span-1',
              render: () => (
                <div>
                  <div className="grid grid-cols-1 min-[800px]:grid-cols-3 min-[1500px]:grid-cols-4 gap-4 justify-items-center">
                    <TopLeaderCard metricLabel="Presenze (all. + partite)" valueUnit="presenze" variant="training" item={pickBestWorst(leaders?.totalPresences).best} distribution={leaders?.totalPresences} />
                    <TopLeaderCard metricLabel="Assenze (all. + partite)" valueUnit="assenze" item={pickBestWorst(leaders?.totalAbsences).best} distribution={leaders?.totalAbsences} />
                    <TopLeaderCard metricLabel="Ritardi (all. + partite)" valueUnit="ritardi" variant="lates" item={pickBestWorst(leaders?.totalLates).best} distribution={leaders?.totalLates} />
                    <TopLeaderCard metricLabel="No response (all. + partite)" valueUnit="no resp." variant="no_response" item={pickBestWorst(leaders?.totalNoResponses).best} distribution={leaders?.totalNoResponses} />
                  </div>
                </div>
              )
            },
            {
              id: 'players-stats-table',
              title: 'Statistiche Giocatori (tabella completa)',
              gridClassName: 'col-span-1',
              render: () => (
                <PlayersStatsTable />
              )
            },
            {
              id: 'leaders-match-performance',
              title: 'Performance Partite',
              gridClassName: 'col-span-1',
              render: () => (
                <div className="grid grid-cols-1 min-[800px]:grid-cols-3 min-[1200px]:grid-cols-4 min-[1500px]:grid-cols-5 gap-4 justify-items-center">
                  <TopLeaderCard metricLabel="Gol" valueUnit="gol" variant="goals" item={pickBestWorst(leaders?.goals).best} distribution={leaders?.goals} />
                  <TopLeaderCard metricLabel="Assist" valueUnit="assist" variant="assists" item={pickBestWorst(leaders?.assists).best} distribution={leaders?.assists} />
                  <TopLeaderCard metricLabel="Minuti giocati" valueUnit="min" variant="minutes" item={pickBestWorst(leaders?.minutesAvg).best} distribution={leaders?.minutesAvg} />
                  <TopLeaderCard metricLabel="Ammonizioni" valueUnit="gialli" variant="yellow" item={pickBestWorst(leaders?.yellowCards).best} distribution={leaders?.yellowCards} />
                  <TopLeaderCard metricLabel="Espulsioni" valueUnit="rossi" variant="red" item={pickBestWorst(leaders?.redCards).best} distribution={leaders?.redCards} />
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