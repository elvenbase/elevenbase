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
import { usePlayers, useStats, useRecentActivity, useLeaders, useTeamTrend, useAttendanceDistribution, useTrainingPresenceSeries, useMatchPresenceSeries, useAttendanceScoreSettings } from "@/hooks/useSupabaseData";

import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart as ReBarChart, Bar } from 'recharts'

import { PlayerForm } from "@/components/forms/PlayerForm";
import { TrainingForm } from "@/components/forms/TrainingForm";
import { MatchForm } from "@/components/forms/MatchForm";
import { TrialistForm } from "@/components/forms/TrialistForm";
import { useAuth } from "@/contexts/AuthContext";
import { computeAttendanceScore, tieBreakComparator } from '@/lib/attendanceScore'
import { useEffect, useRef } from 'react'


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
  const { data: scoreSettings } = useAttendanceScoreSettings()

  const animateOnceRef = useRef(true)
  useEffect(()=>{ animateOnceRef.current = false }, [])

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

  const scoreLeaders = (() => {
    const ids = new Set<string>([...(leaders?.totalPresences||[]), ...(leaders?.totalAbsences||[]), ...(leaders?.lates||[]), ...(leaders?.noResponses||[])].map(x=>x.player_id))

    const toCount = (mapArr: any[]|undefined, pid: string) => {
      const r = (mapArr||[]).find((x:any)=>x.player_id===pid)
      return Number(r?.value ?? r?.count ?? 0)
    }
    const inputs = Array.from(ids).map(pid => ({
      player_id: pid,
      first_name: (leaders?.totalPresences||[]).find((x:any)=>x.player_id===pid)?.first_name,

      last_name: (leaders?.totalPresences||[]).find((x:any)=>x.player_id===pid)?.last_name,

      counters: {
        T_P: toCount(leaders?.trainingPresences, pid),
        T_L: toCount(leaders?.trainingLates, pid),
        T_A: toCount(leaders?.trainingAbsences, pid),
        T_NR: toCount(leaders?.trainingNoResponses, pid),
        M_P: toCount(leaders?.matchPresences, pid),
        M_L: toCount(leaders?.matchLates, pid),
        M_A: toCount(leaders?.matchAbsences, pid),
        M_NR: toCount(leaders?.matchNoResponses, pid),
        mvpAwards: toCount(leaders?.mvpAwards, pid),
      }
    }))
    const weights = scoreSettings ? {
      trainingPresentOnTime: scoreSettings.training_present_on_time ?? 1.0,
      trainingPresentLate: scoreSettings.training_present_late ?? 0.6,
      trainingAbsent: scoreSettings.training_absent ?? -0.8,
      trainingNoResponse: scoreSettings.training_no_response ?? -1.0,
      matchPresentOnTime: scoreSettings.match_present_on_time ?? 2.5,
      matchPresentLate: scoreSettings.match_present_late ?? 1.5,
      matchAbsent: scoreSettings.match_absent ?? -2.0,
      matchNoResponse: scoreSettings.match_no_response ?? -2.5,
      mvpBonusOnce: scoreSettings.mvp_bonus_once ?? 5.0,
    } : undefined
    const scores = inputs.map(it => ({ ...computeAttendanceScore(it.counters, weights as any, scoreSettings?.min_events || 10), player_id: it.player_id, first_name: it.first_name, last_name: it.last_name }))
    const minEv = (scoreSettings?.min_events || 10)
    const eligible = scores.filter(s => s.opportunities >= minEv)
    const sorted = eligible.sort((a,b)=> tieBreakComparator({ ...a, eligible: true, player_id: a.player_id }, { ...b, eligible: true, player_id: b.player_id }))
    return {
      bestTwo: sorted.slice(0,2),
      worstTwo: sorted.slice(-2).reverse(),
    }
  })()
  
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

  const placeholderDates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (9 - i));
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  })
  const placeholderLine = placeholderDates.map(date => ({ date, value: 0, points: 0 }))
  const placeholderBars = [{ name: 'Allen.', present: 0, late: 0, absent: 0, pending: 0, no_response: 0 }, { name: 'Partite', present: 0, late: 0, absent: 0, pending: 0, no_response: 0 }]

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

        <div className="grid grid-cols-1 min-[800px]:grid-cols-4 gap-6 mb-8">
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
                    <ChartContainer config={{
                      points: { label: 'Punti', color: 'hsl(var(--primary))' },
                    }} className="h-full">
                      <ReLineChart data={(trend?.series as any) || placeholderLine} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="points" stroke="var(--color-points)" strokeWidth={2} dot={false} isAnimationActive={animateOnceRef.current} />
                      </ReLineChart>
                    </ChartContainer>
                    {(!trend?.series || trend.series.length === 0) && (
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
                    <ChartContainer config={{ presenze: { label: 'Presenze', color: 'hsl(var(--success))' } }} className="h-full">
                      <ReLineChart data={trainingSeries?.curr || placeholderLine} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="value" name="Presenze" stroke="var(--color-presenze)" strokeWidth={2} dot={false} isAnimationActive={animateOnceRef.current} />
                      </ReLineChart>
                    </ChartContainer>
                    {(!trainingSeries?.curr || trainingSeries.curr.length === 0) && (
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
                    <ChartContainer config={{ presenze: { label: 'Presenze', color: 'hsl(var(--accent))' } }} className="h-full">
                      <ReLineChart data={matchSeries?.curr || placeholderLine} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="value" name="Presenze" stroke="var(--color-presenze)" strokeWidth={2} dot={false} isAnimationActive={animateOnceRef.current} />
                      </ReLineChart>
                    </ChartContainer>
                    {(!matchSeries?.curr || matchSeries.curr.length === 0) && (
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
                    <ChartContainer config={{
                      present: { label: 'Presenti', color: 'hsl(var(--success))' },
                      late: { label: 'Ritardi', color: '#f59e0b' },
                      absent: { label: 'Assenti', color: 'hsl(var(--destructive))' },
                      pending: { label: 'In attesa', color: '#94a3b8' },
                      no_response: { label: 'No response', color: '#a3a3a3' },
                    }} className="h-full">
                      <ReBarChart data={attendanceDist ? [{ name: 'Allen.', ...attendanceDist.training }, { name: 'Partite', ...attendanceDist.match }] : placeholderBars} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent className="text-[9px] sm:text-xs" />} />
                        <Bar dataKey="present" fill="var(--color-present)" isAnimationActive={animateOnceRef.current} />
                        <Bar dataKey="late" fill="var(--color-late)" isAnimationActive={animateOnceRef.current} />
                        <Bar dataKey="absent" fill="var(--color-absent)" isAnimationActive={animateOnceRef.current} />
                        <Bar dataKey="pending" fill="var(--color-pending)" isAnimationActive={animateOnceRef.current} />
                        <Bar dataKey="no_response" fill="var(--color-no_response)" isAnimationActive={animateOnceRef.current} />
                      </ReBarChart>
                    </ChartContainer>
                    {!attendanceDist && (
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
                <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
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
                <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
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
                <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                  <TopLeaderCard metricLabel="Presenze (all. + partite)" valueUnit="presenze" variant="training" item={pickBestWorst(leaders?.totalPresences).best} distribution={leaders?.totalPresences} />
                  <TopLeaderCard metricLabel="Assenze (all. + partite)" valueUnit="assenze" item={pickBestWorst(leaders?.totalAbsences).best} distribution={leaders?.totalAbsences} />
                  <TopLeaderCard metricLabel="Ritardi (all. + partite)" valueUnit="ritardi" variant="lates" item={pickBestWorst(leaders?.lates).best} distribution={leaders?.lates} />
                  <TopLeaderCard metricLabel="No response (all. + partite)" valueUnit="no resp." variant="no_response" item={pickBestWorst(leaders?.noResponses).best} distribution={leaders?.noResponses} />
                </div>
              )
            },
            {
              id: 'leaders-match-performance',
              title: 'Performance Partite',
              gridClassName: 'col-span-1',
              render: () => (
                <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                  <TopLeaderCard metricLabel="Gol" valueUnit="gol" variant="goals" item={pickBestWorst(leaders?.goals).best} distribution={leaders?.goals} />
                  <TopLeaderCard metricLabel="Assist" valueUnit="assist" variant="assists" item={pickBestWorst(leaders?.assists).best} distribution={leaders?.assists} />
                  <TopLeaderCard metricLabel="Ammonizioni" valueUnit="gialli" variant="yellow" item={pickBestWorst(leaders?.yellowCards).best} distribution={leaders?.yellowCards} />
                  <TopLeaderCard metricLabel="Espulsioni" valueUnit="rossi" variant="red" item={pickBestWorst(leaders?.redCards).best} distribution={leaders?.redCards} />
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
              id: 'attendance-score-leaders',
              title: 'Squad Score — Migliori e Peggiori',
              gridClassName: 'col-span-1',
              render: () => (
                <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                  {scoreLeaders.bestTwo.slice(0,1).map((s)=> (
                    <TopLeaderCard
                      key={`best-1`}
                      metricLabel={`Score migliore`}
                      valueUnit="pt"
                      variant="score_best"
                      item={{ player: {
                        id: (leaders?.bestScorePlayer?.id || s.player_id) as any,
                        first_name: s.first_name || '-',
                        last_name: s.last_name || '-',
                        avatar_url: playerById.get((leaders?.bestScorePlayer?.id || s.player_id) as any)?.avatar_url || null,
                        role_code: playerById.get((leaders?.bestScorePlayer?.id || s.player_id) as any)?.role_code || null,
                        jersey_number: playerById.get((leaders?.bestScorePlayer?.id || s.player_id) as any)?.jersey_number ?? null,
                      }, value: Number(s.score0to100 || s.value || 0) }}
                      distribution={[]}
                    />
                  ))}
                  {scoreLeaders.worstTwo.slice(0,1).map((s)=> (
                    <TopLeaderCard
                      key={`worst-1`}
                      metricLabel={`Score peggiore`}
                      valueUnit="pt"
                      variant="score_worst"
                      item={{ player: {
                        id: (leaders?.worstScorePlayer?.id || s.player_id) as any,
                        first_name: s.first_name || '-',
                        last_name: s.last_name || '-',
                        avatar_url: playerById.get((leaders?.worstScorePlayer?.id || s.player_id) as any)?.avatar_url || null,
                        role_code: playerById.get((leaders?.worstScorePlayer?.id || s.player_id) as any)?.role_code || null,
                        jersey_number: playerById.get((leaders?.worstScorePlayer?.id || s.player_id) as any)?.jersey_number ?? null,
                      }, value: Number(s.score0to100 || s.value || 0) }}
                      distribution={[]}
                    />
                  ))}
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