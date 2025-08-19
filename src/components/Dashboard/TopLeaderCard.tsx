import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Award, RotateCcw, Search, CalendarCheck2, CalendarX, AlarmClock, MailX, CornerDownRight, Timer, Trophy, SquareMinus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { PieChart as RePieChart, Pie as RePie, Cell as ReCell, Tooltip as ReTooltip, ResponsiveContainer as ReResponsiveContainer } from 'recharts'

type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null }

type Props = {
  metricLabel: string
  valueUnit: string
  variant?: 'training' | 'lates' | 'matches' | 'no_response' | 'goals' | 'assists' | 'minutes' | 'saves' | 'yellow' | 'red' | 'neutral'
  item?: { player: PlayerRef; value?: number; percent?: number; count?: number } | null
  distribution?: Array<{ player_id: string; value?: number; count?: number; percent?: number; first_name?: string; last_name?: string }>
  onSegmentOpen?: (filter: { label: string; playerIds: string[] }) => void
}

export const TopLeaderCard = ({ metricLabel, valueUnit, variant = 'neutral', item, distribution = [], onSegmentOpen }: Props) => {
  const theme = (() => {
    switch (variant) {
      case 'training':
        return { pillBg: 'bg-success/15', pillText: 'text-success', cardBg: 'bg-gradient-to-br from-success/5 to-transparent' }
      case 'lates':
        return { pillBg: 'bg-warning/15', pillText: 'text-warning', cardBg: 'bg-gradient-to-br from-warning/10 to-transparent' }
      case 'matches':
        return { pillBg: 'bg-accent/15', pillText: 'text-accent', cardBg: 'bg-gradient-to-br from-accent/5 to-transparent' }
      case 'no_response':
        return { pillBg: 'bg-muted', pillText: 'text-foreground', cardBg: 'bg-gradient-to-br from-muted/30 to-transparent' }
      case 'goals':
        return { pillBg: 'bg-primary/15', pillText: 'text-primary', cardBg: 'bg-gradient-to-br from-primary/5 to-transparent' }
      case 'assists':
        return { pillBg: 'bg-accent/15', pillText: 'text-accent', cardBg: 'bg-gradient-to-br from-accent/5 to-transparent' }
      case 'minutes':
        return { pillBg: 'bg-secondary/15', pillText: 'text-secondary', cardBg: 'bg-gradient-to-br from-secondary/10 to-transparent' }
      case 'saves':
        return { pillBg: 'bg-success/15', pillText: 'text-success', cardBg: 'bg-gradient-to-br from-success/5 to-transparent' }
      case 'yellow':
        return { pillBg: 'bg-warning/15', pillText: 'text-warning', cardBg: 'bg-gradient-to-br from-warning/10 to-transparent' }
      case 'red':
        return { pillBg: 'bg-destructive/15', pillText: 'text-destructive', cardBg: 'bg-gradient-to-br from-destructive/5 to-transparent' }
      default:
        return { pillBg: 'bg-muted', pillText: 'text-foreground', cardBg: 'bg-gradient-to-br from-muted/20 to-transparent' }
    }
  })()

  const AnimatedNumber = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0)
    const [bump, setBump] = useState(false)
    useEffect(() => {
      let raf: number
      const start = performance.now()
      const duration = 600
      const from = display
      const to = value
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        const current = Math.round(from + (to - from) * eased)
        setDisplay(current)
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      if (value > display) {
        setBump(true)
        const id = setTimeout(() => setBump(false), 500)
        return () => { cancelAnimationFrame(raf); clearTimeout(id) }
      }
      return () => cancelAnimationFrame(raf)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])
    return <span className={`tabular-nums ${bump ? 'animate-pulse' : ''}`}>{display}</span>
  }
  // Flip state
  const [flipped, setFlipped] = useState(false)

  // Metric color/icon style map (hex tints per spec)
  const metricStyle = (() => {
    switch (variant) {
      case 'training':
        return { headerBg: '#E8F6EE', accent: '#2EB872', icon: CalendarCheck2 }
      case 'matches':
        return { headerBg: '#EAF3FF', accent: '#2D77FF', icon: CalendarCheck2 }
      case 'lates':
        return { headerBg: '#FFF1E5', accent: '#E39D2E', icon: AlarmClock }
      case 'no_response':
        return { headerBg: '#ECF2F7', accent: '#5C7A99', icon: MailX }
      case 'goals':
        return { headerBg: '#EAF3FF', accent: '#2D77FF', icon: Trophy }
      case 'assists':
        return { headerBg: '#E9F7FE', accent: '#179DDC', icon: CornerDownRight }
      case 'minutes':
        return { headerBg: '#ECEBFF', accent: '#5A57E3', icon: Timer }
      case 'yellow':
        return { headerBg: '#FFF8DB', accent: '#C7A300', icon: SquareMinus }
      case 'red':
        return { headerBg: '#FFE9EB', accent: '#D83A3A', icon: SquareMinus }
      default: {
        // Fallback + derive for assenze by label
        const isAbs = /Assenze/i.test(metricLabel)
        if (isAbs) return { headerBg: '#F7F1E6', accent: '#A77D2C', icon: CalendarX }
        return { headerBg: '#F3F4F6', accent: '#334155', icon: Trophy }
      }
    }
  })()
  const SectionIcon = metricStyle.icon

  // Build simple distribution for the back side
  const { pieData, legend, baseN } = useMemo(() => {
    const src = (distribution || []) as Array<any>
    const nPlayers = src.length
    const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)))
    const colors = variant === 'training' ? ['#86efac', '#fde68a', '#fecaca']
      : variant === 'lates' ? ['#fde68a', '#fdba74', '#fca5a5']
      : variant === 'matches' ? ['#93c5fd', '#bfdbfe', '#e5e7eb']
      : variant === 'goals' || variant === 'assists' ? ['#93c5fd', '#a7f3d0', '#fde68a']
      : variant === 'yellow' ? ['#fde68a', '#facc15', '#f59e0b']
      : variant === 'red' ? ['#fecaca', '#fca5a5', '#ef4444']
      : ['#e5e7eb', '#cbd5e1', '#a1a1aa']

    const buckets = (() => {
      // Heuristics: decide strategy by variant/metricLabel
      const isRate = /Presenze/.test(metricLabel)
      if (isRate) {
        const high = src.filter(r => (r.percent || 0) >= 80)
        const mid = src.filter(r => (r.percent || 0) >= 40 && (r.percent || 0) < 80)
        const low = src.filter(r => (r.percent || 0) < 40)
        return [
          { key: 'Alta (≥80%)', ids: high.map(r => r.player_id) },
          { key: 'Media (40–79%)', ids: mid.map(r => r.player_id) },
          { key: 'Bassa (<40%)', ids: low.map(r => r.player_id) },
        ]
      }
      // Counts buckets: 0 · 1–2 · ≥3
      const v = (r: any) => Number(r.value ?? r.count ?? 0)
      const zero = src.filter(r => v(r) === 0)
      const oneTwo = src.filter(r => v(r) >= 1 && v(r) <= 2)
      const threePlus = src.filter(r => v(r) >= 3)
      return [
        { key: '0', ids: zero.map(r => r.player_id) },
        { key: '1–2', ids: oneTwo.map(r => r.player_id) },
        { key: '≥3', ids: threePlus.map(r => r.player_id) },
      ]
    })()

    const chartData = buckets.map((b, i) => ({ name: b.key, value: b.ids.length, fill: colors[i % colors.length], ids: b.ids }))
    const total = chartData.reduce((s, r) => s + r.value, 0)
    const legendItems = chartData.map(d => ({ label: d.name, pct: total ? clamp((d.value / total) * 100) : 0, color: d.fill, ids: d.ids }))
    return { pieData: chartData, legend: legendItems, baseN: nPlayers }
  }, [distribution, metricLabel, variant])

  if (!item) {
    return (
      <Card className={`p-4 ${theme.cardBg} bg-card/80 border-border hover:shadow-glow transition-smooth`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-in fade-in-0" />
            <div>
              <div className="text-sm font-semibold text-foreground">—</div>
              <div className="text-xs text-muted-foreground">{metricLabel}</div>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${theme.pillBg} ${theme.pillText} text-sm font-bold`}>
            <Award className="h-4 w-4" />—
          </div>
        </div>
      </Card>
    )
  }

  const p = item.player
  const value = (item.value ?? item.count ?? 0)
  const to = `/player/${p.id}`

  return (
    <div className="group [perspective:1000px] min-h-[176px] sm:min-h-[200px] lg:min-h-[224px] w-full">
      <div className={`relative h-full w-full [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        {/* Front */}
        <Link to={to} className="block absolute inset-0 [backface-visibility:hidden]">
          <Card className={`p-4 sm:px-6 lg:px-8 bg-card/80 border border-border rounded-2xl shadow-card hover:shadow-glow transition-smooth h-full overflow-hidden`} onClick={(e)=>{ e.preventDefault(); setFlipped(true) }}>
            <div className="flex flex-col h-full animate-in fade-in-0">
              {/* Header metric band */}
              <div className="flex items-center gap-2 h-9 sm:h-10 rounded-t-[inherit] px-3 sm:px-4" style={{ backgroundColor: metricStyle.headerBg }}>
                <SectionIcon className="h-4 w-4" style={{ color: metricStyle.accent }} aria-hidden />
                <div className="truncate font-semibold text-[13px] sm:text-[14px]" style={{ color: '#0f172a' }}>{metricLabel}</div>
              </div>
              {/* Hero band */}
              <div className="relative flex-1 flex items-center gap-3 sm:gap-4 px-1 sm:px-2 py-2">
                {/* subtle radial gradient anchored to avatar */}
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(60% 60% at 15% 50%, ${metricStyle.accent}22 0%, transparent 70%)` }} />
                {/* Avatar block */}
                <div className="relative -translate-x-1.5 sm:-translate-x-2 flex items-center">
                  <div className="relative shadow-sm">
                    <PlayerAvatar firstName={p.first_name} lastName={p.last_name} avatarUrl={p.avatar_url || undefined} size="xl" className="h-14 w-14 sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]" />
                  </div>
                </div>
                {/* Name + subtitle */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-semibold text-[18px] sm:text-[20px] lg:text-[22px]">{p.first_name} {p.last_name}</div>
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded bg-white border border-white text-[10px]" aria-hidden>🏆</span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground truncate">Migliore {metricLabel.toLowerCase()} nel periodo</div>
                </div>
                {/* Value pill */}
                <div className="flex items-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full h-8 sm:h-9 px-3 sm:px-4 transition-transform group-hover:scale-[1.02]" style={{ backgroundColor: metricStyle.headerBg }}>
                    <SectionIcon className="h-4 w-4" style={{ color: metricStyle.accent }} aria-hidden />
                    <span className="font-bold tabular-nums text-[20px] sm:text-[22px] lg:text-[24px]" style={{ color: metricStyle.accent }}>{value}</span>
                    <span className="text-[13px] sm:text-[14px] lowercase" style={{ color: metricStyle.accent }}>{valueUnit}</span>
                  </div>
                </div>
              </div>
              {/* Footer band */}
              <div className="flex items-center justify-between h-6 sm:h-7 text-[12px] sm:text-[13px] text-slate-700">
                <span className="truncate">Migliore nel periodo. Tocca per vedere il confronto squadra.</span>
                <button onClick={(e)=>{ e.preventDefault(); setFlipped(true) }} className="text-slate-700 hover:opacity-80" aria-label="Apri confronto squadra con flip">↻ Flip</button>
              </div>
            </div>
          </Card>
        </Link>
        {/* Back */}
        <Card className={`p-4 ${theme.cardBg} bg-card/80 border-border hover:shadow-glow transition-smooth absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden`}>
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between">
              <div className="text-xs text-muted-foreground">Base: {baseN} giocatori</div>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={()=>setFlipped(false)} aria-label="Torna al fronte"><RotateCcw className="h-4 w-4"/></button>
            </div>
            <div className="mt-2 h-[7.5rem] sm:h-[8.5rem] flex-shrink-0">
              <ReResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <RePie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={54} isAnimationActive>
                    {pieData?.map((entry, index) => (
                      <ReCell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </RePie>
                  <ReTooltip formatter={(value:any, name:any)=>{
                    const n = Number(value || 0)
                    const pct = baseN ? Math.round((n / baseN) * 100) : 0
                    return [`${pct}% (${n} giocatori)`, name]
                  }} />
                </RePieChart>
              </ReResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1 overflow-auto">
              {legend?.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: l.color }} />
                    <span className="text-muted-foreground">{l.label}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="font-semibold text-foreground">{l.pct}%</span>
                    {onSegmentOpen && (
                      <button className="text-muted-foreground hover:text-foreground" onClick={()=>onSegmentOpen({ label: l.label, playerIds: l.ids })} aria-label="Apri dettagli segmento">
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TopLeaderCard