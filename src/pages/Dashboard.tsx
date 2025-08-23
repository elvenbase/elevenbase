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

  // Create multiple queries for different periods - using UTC to avoid timezone issues
  const now = new Date()
  
  // Current month (August 2025) - using UTC to avoid timezone shifts
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const currentEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  const { data: leadersCurrentMonth } = useLeaders({ startDate: currentStart, endDate: currentEnd })
  
  // Previous month (July 2025) - using UTC to avoid timezone shifts
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-1, 1))
  const previousEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))
  

  
  const { data: leadersPreviousMonth } = useLeaders({ startDate: previousStart, endDate: previousEnd })
  
  // All time (no date filters)
  const { data: leadersAllTime } = useLeaders({})
  
  // Maintain compatibility with existing code that still references 'leaders'
  const leaders = leadersCurrentMonth // Default to current month for backward compatibility
  const start = currentStart
  const end = currentEnd
  
  // Charts with period support - using the corrected UTC dates
  const { data: trendCurrentMonth } = useTeamTrend({ limit: 10, startDate: currentStart, endDate: currentEnd })
  const { data: trendPreviousMonth } = useTeamTrend({ limit: 10, startDate: previousStart, endDate: previousEnd })
  const { data: trendAllTime } = useTeamTrend({ limit: 10 })
  
  const { data: attendanceDistCurrentMonth } = useAttendanceDistribution({ startDate: currentStart, endDate: currentEnd })
  const { data: attendanceDistPreviousMonth } = useAttendanceDistribution({ startDate: previousStart, endDate: previousEnd })
  const { data: attendanceDistAllTime } = useAttendanceDistribution({})
  
  // Legacy support
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
  


    // Get leaders data for the specified period
  const getLeadersForPeriod = (period: string) => {
    switch (period) {
      case 'current':
        return leadersCurrentMonth
      case 'previous':
        return leadersPreviousMonth
      case 'beginning':
        return leadersAllTime
      default:
        return leadersCurrentMonth
    }
  }

  // Get real data for specific metric and period
  const getDataForPeriodAndMetric = (metricName: string, period = 'current') => {
    const periodLeaders = getLeadersForPeriod(period)
    if (!periodLeaders) return []
    
    // Map metric names to leader fields
    const metricMap: Record<string, any> = {
      'trainingPresences': periodLeaders.trainingPresences,
      'trainingAbsences': periodLeaders.trainingAbsences,
      'trainingLates': periodLeaders.trainingLates,
      'trainingNoResponses': periodLeaders.trainingNoResponses,
      'matchPresences': periodLeaders.matchPresences,
      'matchAbsences': periodLeaders.matchAbsences,
      'matchLates': periodLeaders.matchLates,
      'matchNoResponses': periodLeaders.matchNoResponses,
      'totalPresences': periodLeaders.totalPresences,
      'totalAbsences': periodLeaders.totalAbsences,
      'lates': periodLeaders.lates,
      'noResponses': periodLeaders.noResponses,
      'goals': periodLeaders.goals,
      'assists': periodLeaders.assists,
      'yellowCards': periodLeaders.yellowCards,
      'redCards': periodLeaders.redCards
    }
    
    return metricMap[metricName] || []
  }

  // Check if a section has data for the given period
  const hasDataForPeriod = (sectionMetrics: string[], period: string) => {
    return sectionMetrics.some(metric => {
      const data = getDataForPeriodAndMetric(metric, period)
      return data && data.length > 0
    })
  }

  // Get period label for display
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'current': return 'il mese corrente'
      case 'previous': return 'il mese precedente'
      case 'beginning': return 'tutto il periodo'
      default: return 'il periodo selezionato'
    }
  }

  // Get chart data for specific period
  const getTrendForPeriod = (period: string) => {
    switch (period) {
      case 'current': return trendCurrentMonth
      case 'previous': return trendPreviousMonth
      case 'beginning': return trendAllTime
      default: return trendCurrentMonth
    }
  }

  const getAttendanceDistForPeriod = (period: string) => {
    switch (period) {
      case 'current': return attendanceDistCurrentMonth
      case 'previous': return attendanceDistPreviousMonth
      case 'beginning': return attendanceDistAllTime
      default: return attendanceDistCurrentMonth
    }
  }

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

  // Calculate Squad Score for specific period
  const calculateScoreLeaders = (periodLeaders: any) => {
    if (!periodLeaders) return { bestTwo: [], worstTwo: [], hasInsufficientEvents: false, totalPlayersWithData: 0, minEventsRequired: 10 }
    
    const ids = new Set<string>([...(periodLeaders?.totalPresences||[]), ...(periodLeaders?.totalAbsences||[]), ...(periodLeaders?.lates||[]), ...(periodLeaders?.noResponses||[])].map(x=>x.player_id))

    const toCount = (mapArr: any[]|undefined, pid: string) => {
      const r = (mapArr||[]).find((x:any)=>x.player_id===pid)
      return Number(r?.value ?? r?.count ?? 0)
    }
    const inputs = Array.from(ids).map(pid => ({
      player_id: pid,
      first_name: (periodLeaders?.totalPresences||[]).find((x:any)=>x.player_id===pid)?.first_name,

      last_name: (periodLeaders?.totalPresences||[]).find((x:any)=>x.player_id===pid)?.last_name,

      counters: {
        T_P: toCount(periodLeaders?.trainingPresences, pid),
        T_L: toCount(periodLeaders?.trainingLates, pid),
        T_A: toCount(periodLeaders?.trainingAbsences, pid),
        T_NR: toCount(periodLeaders?.trainingNoResponses, pid),
        M_P: toCount(periodLeaders?.matchPresences, pid),
        M_L: toCount(periodLeaders?.matchLates, pid),
        M_A: toCount(periodLeaders?.matchAbsences, pid),
        M_NR: toCount(periodLeaders?.matchNoResponses, pid),
        mvpAwards: toCount(periodLeaders?.mvpAwards, pid),
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
    const ineligible = scores.filter(s => s.opportunities < minEv && s.opportunities > 0)
    const sorted = eligible.sort((a,b)=> tieBreakComparator({ ...a, eligible: true, player_id: a.player_id }, { ...b, eligible: true, player_id: b.player_id }))
    
    return {
      bestTwo: sorted.slice(0,2),
      worstTwo: sorted.slice(-2).reverse(),
      topFive: sorted.slice(0,5).map((s, index) => ({ ...s, rank: index + 1 })),
      bottomFive: sorted.slice(-5).reverse().map((s, index) => ({ ...s, rank: sorted.length - index })),
      hasInsufficientEvents: ineligible.length > 0,
      totalPlayersWithData: scores.length,
      minEventsRequired: minEv
    }
  }

  // Legacy scoreLeaders for backward compatibility
  const scoreLeaders = calculateScoreLeaders(leaders)
  

  
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
          <p className="text-muted-foreground">Panoramica generale del club</p>
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
            title="Provinanti"
            value={stats?.activeTrials || 0}
            icon={Shield}
            description="Giocatori in prova"
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
              hasPeriodSelector: true,
              render: (period = 'current') => {
                const periodAttendanceDist = getAttendanceDistForPeriod(period)
                
                if (!periodAttendanceDist || periodAttendanceDist.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">
                        📊 Nessun dato disponibile
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Non ci sono dati di distribuzione per {getPeriodLabel(period)}
                      </div>
                    </div>
                  )
                }
                
                return (
                <div>
                  <div className="h-64">
                    <ChartContainer config={{
                      present: { label: 'Presenti', color: 'hsl(var(--success))' },
                      late: { label: 'Ritardi', color: '#f59e0b' },
                      absent: { label: 'Assenti', color: 'hsl(var(--destructive))' },
                      pending: { label: 'In attesa', color: '#94a3b8' },
                      no_response: { label: 'No response', color: '#a3a3a3' },
                    }} className="h-full">
                      <ReBarChart data={periodAttendanceDist ? [{ name: 'Allen.', ...periodAttendanceDist.training }, { name: 'Partite', ...periodAttendanceDist.match }] : placeholderBars} margin={{ left: -4, right: 6, top: 6, bottom: 6 }}>
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
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">Periodo: {getPeriodLabel(period)}</div>
                </div>
                )
              }
            },
            {
              id: 'leaders-training-presences',
              title: 'Presenze Allenamenti',
              gridClassName: 'col-span-1',
              hasPeriodSelector: true,
              render: (period = 'current') => {
                const sectionMetrics = ['trainingPresences', 'trainingAbsences', 'trainingLates', 'trainingNoResponses']
                const hasData = hasDataForPeriod(sectionMetrics, period)
                
                if (!hasData) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">
                        📊 Nessun dato disponibile
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Non ci sono dati sugli allenamenti per {getPeriodLabel(period)}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                    <TopLeaderCard metricLabel="Presenze allenamenti" valueUnit="presenze" variant="training" item={pickBestWorst(getDataForPeriodAndMetric('trainingPresences', period)).best} distribution={getDataForPeriodAndMetric('trainingPresences', period)} />
                    <TopLeaderCard metricLabel="Assenze allenamenti" valueUnit="assenze" variant="absences" item={pickBestWorst(getDataForPeriodAndMetric('trainingAbsences', period)).best} distribution={getDataForPeriodAndMetric('trainingAbsences', period)} />
                    <TopLeaderCard metricLabel="Ritardi allenamenti" valueUnit="ritardi" variant="lates" item={pickBestWorst(getDataForPeriodAndMetric('trainingLates', period)).best} distribution={getDataForPeriodAndMetric('trainingLates', period)} />
                    <TopLeaderCard metricLabel="No response (allenamenti)" valueUnit="no risp." variant="no_response" item={pickBestWorst(getDataForPeriodAndMetric('trainingNoResponses', period)).best} distribution={getDataForPeriodAndMetric('trainingNoResponses', period)} />
                  </div>
                )
              }
            },
            {
              id: 'leaders-match-presences',
              title: 'Presenze Partite',
              gridClassName: 'col-span-1',
              hasPeriodSelector: true,
              render: (period = 'current') => {
                const sectionMetrics = ['matchPresences', 'matchAbsences', 'matchLates', 'matchNoResponses']
                const hasData = hasDataForPeriod(sectionMetrics, period)
                
                if (!hasData) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">
                        ⚽ Nessun dato disponibile
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Non ci sono dati sulle partite per {getPeriodLabel(period)}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                    <TopLeaderCard metricLabel="Presenze partite" valueUnit="presenze" variant="matches" item={pickBestWorst(getDataForPeriodAndMetric('matchPresences', period)).best} distribution={getDataForPeriodAndMetric('matchPresences', period)} />
                    <TopLeaderCard metricLabel="Assenze partite" valueUnit="assenze" variant="absences" item={pickBestWorst(getDataForPeriodAndMetric('matchAbsences', period)).best} distribution={getDataForPeriodAndMetric('matchAbsences', period)} />
                    <TopLeaderCard metricLabel="Ritardi partite" valueUnit="ritardi" variant="lates" item={pickBestWorst(getDataForPeriodAndMetric('matchLates', period)).best} distribution={getDataForPeriodAndMetric('matchLates', period)} />
                    <TopLeaderCard metricLabel="No response (partite)" valueUnit="no risp." variant="no_response" item={pickBestWorst(getDataForPeriodAndMetric('matchNoResponses', period)).best} distribution={getDataForPeriodAndMetric('matchNoResponses', period)} />
                  </div>
                )
              }
            },
            {
              id: 'leaders-total-presences',
              title: 'Presenze Totali',
              gridClassName: 'col-span-1',
              hasPeriodSelector: true,
              render: (period = 'current') => {
                const sectionMetrics = ['totalPresences', 'totalAbsences', 'lates', 'noResponses']
                const hasData = hasDataForPeriod(sectionMetrics, period)
                
                if (!hasData) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">
                        📈 Nessun dato disponibile
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Non ci sono dati complessivi per {getPeriodLabel(period)}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                    <TopLeaderCard metricLabel="Presenze (all. + partite)" valueUnit="presenze" variant="training" item={pickBestWorst(getDataForPeriodAndMetric('totalPresences', period)).best} distribution={getDataForPeriodAndMetric('totalPresences', period)} />
                    <TopLeaderCard metricLabel="Assenze (all. + partite)" valueUnit="assenze" variant="absences" item={pickBestWorst(getDataForPeriodAndMetric('totalAbsences', period)).best} distribution={getDataForPeriodAndMetric('totalAbsences', period)} />
                    <TopLeaderCard metricLabel="Ritardi (all. + partite)" valueUnit="ritardi" variant="lates" item={pickBestWorst(getDataForPeriodAndMetric('lates', period)).best} distribution={getDataForPeriodAndMetric('lates', period)} />
                    <TopLeaderCard metricLabel="No response (all. + partite)" valueUnit="no risp." variant="no_response" item={pickBestWorst(getDataForPeriodAndMetric('noResponses', period)).best} distribution={getDataForPeriodAndMetric('noResponses', period)} />
                  </div>
                )
              }
            },
            {
              id: 'leaders-match-performance',
              title: 'Performance Partite',
              gridClassName: 'col-span-1',
              hasPeriodSelector: true,
              render: (period = 'current') => {
                const sectionMetrics = ['goals', 'assists', 'yellowCards', 'redCards']
                const hasData = hasDataForPeriod(sectionMetrics, period)
                
                if (!hasData) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">
                        🏆 Nessun dato disponibile
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Non ci sono statistiche di gioco per {getPeriodLabel(period)}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                    <TopLeaderCard metricLabel="Gol" valueUnit="gol" variant="goals" item={pickBestWorst(getDataForPeriodAndMetric('goals', period)).best} distribution={getDataForPeriodAndMetric('goals', period)} />
                    <TopLeaderCard metricLabel="Assist" valueUnit="assist" variant="assists" item={pickBestWorst(getDataForPeriodAndMetric('assists', period)).best} distribution={getDataForPeriodAndMetric('assists', period)} />
                    <TopLeaderCard metricLabel="Ammonizioni" valueUnit="gialli" variant="yellow" item={pickBestWorst(getDataForPeriodAndMetric('yellowCards', period)).best} distribution={getDataForPeriodAndMetric('yellowCards', period)} />
                    <TopLeaderCard metricLabel="Espulsioni" valueUnit="rossi" variant="red" item={pickBestWorst(getDataForPeriodAndMetric('redCards', period)).best} distribution={getDataForPeriodAndMetric('redCards', period)} />
                  </div>
                )
              }
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
              hasPeriodSelector: true,
              render: (period = 'current') => {
                const periodLeaders = getLeadersForPeriod(period)
                const periodScoreLeaders = calculateScoreLeaders(periodLeaders)
                
                if (!periodScoreLeaders.bestTwo.length && !periodScoreLeaders.worstTwo.length) {
                  // Check if we have data but insufficient events
                  if (periodScoreLeaders.hasInsufficientEvents) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="text-muted-foreground text-sm mb-2">
                          ⚠️ Eventi insufficienti
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {periodScoreLeaders.totalPlayersWithData} giocatori con dati per {getPeriodLabel(period)}, ma servono almeno {periodScoreLeaders.minEventsRequired} eventi per calcolare lo Squad Score
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground text-sm mb-2">
                        🏆 Nessun dato disponibile
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Non ci sono dati Squad Score per {getPeriodLabel(period)}
                      </div>
                    </div>
                  )
                }
                
                return (
                <div className="grid grid-cols-1 min-[1000px]:grid-cols-4 min-[1440px]:grid-cols-4 min-[1800px]:grid-cols-4 gap-4 justify-items-stretch">
                  {periodScoreLeaders.bestTwo.slice(0,1).map((s)=> (
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
                      distribution={periodScoreLeaders.topFive.map(player => ({
                        player_id: player.player_id,
                        first_name: player.first_name,
                        last_name: player.last_name,
                        value: Math.round(player.score0to100 || 0)
                      }))}
                    />
                  ))}
                  {periodScoreLeaders.worstTwo.slice(0,1).map((s)=> (
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
                      distribution={periodScoreLeaders.bottomFive.map(player => ({
                        player_id: player.player_id,
                        first_name: player.first_name,
                        last_name: player.last_name,
                        value: Math.round(player.score0to100 || 0)
                      }))}
                    />
                  ))}
                </div>
                )
              }
            },
          ]}
        />
      </div>
    </div>
  );
};

export default Dashboard;