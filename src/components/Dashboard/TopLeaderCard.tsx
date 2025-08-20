import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { RotateCcw, Search, CalendarCheck2, CalendarX, AlarmClock, MailX, CornerDownRight, Timer, Trophy, SquareMinus } from 'lucide-react'
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
        const isAbs = /Assenze/i.test(metricLabel)
        if (isAbs) return { headerBg: '#F7F1E6', accent: '#A77D2C', icon: CalendarX }
        return { headerBg: '#F3F4F6', accent: '#334155', icon: Trophy }
      }
    }
  })()
  const SectionIcon = metricStyle.icon

  // Dynamic caption for backside base count, tailored by metric/variant
  const baseCaption = useMemo(() => {
    const lower = metricLabel.toLowerCase()
    const mentionsTraining = /allenament/.test(lower) || /all\./.test(lower)
    const mentionsMatches = /partit/.test(lower)
    const scope = mentionsTraining && mentionsMatches
      ? 'agli allenamenti e partite'
      : mentionsTraining
        ? 'agli allenamenti'
        : mentionsMatches
          ? 'alle partite'
          : ''
    const withScope = (base: string) => scope ? `${base} ${scope}` : base

    switch (variant) {
      case 'training':
        return withScope('Giocatori con almeno 1 presenza')
      case 'matches':
        return withScope('Giocatori con almeno 1 presenza')
      case 'lates':
        return withScope('Giocatori con almeno 1 ritardo')
      case 'no_response':
        return withScope('Giocatori con almeno 1 mancata risposta')
      case 'goals':
        return withScope('Giocatori con almeno 1 gol')
      case 'assists':
        return withScope('Giocatori con almeno 1 assist')
      case 'minutes':
        return 'Giocatori con minuti registrati'
      case 'saves':
        return withScope('Giocatori con almeno 1 parata')
      case 'yellow':
        return withScope('Giocatori con almeno 1 ammonizione')
      case 'red':
        return withScope('Giocatori con almeno 1 espulsione')
      default: {
        if (/assenze/i.test(lower)) return withScope('Giocatori con almeno 1 assenza')
        if (/presenze/i.test(lower)) return withScope('Giocatori con almeno 1 presenza')
        return 'Giocatori coinvolti'
      }
    }
  }, [variant, metricLabel])

  // Backside distribution
  const { pieData, legend, baseN, topFive } = useMemo(() => {
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

    const isRate = /Presenze/.test(metricLabel)
    let buckets: Array<{ key: string; ids: string[] }>
    if (isRate) {
      const high = src.filter(r => (r.percent || 0) >= 80)
      const mid = src.filter(r => (r.percent || 0) >= 40 && (r.percent || 0) < 80)
      const low = src.filter(r => (r.percent || 0) < 40)
      buckets = [
        { key: 'Alta (≥80%)', ids: high.map(r => r.player_id) },
        { key: 'Media (40–79%)', ids: mid.map(r => r.player_id) },
        { key: 'Bassa (<40%)', ids: low.map(r => r.player_id) },
      ]
    } else {
      const v = (r: any) => Number(r.value ?? r.count ?? 0)
      const zero = src.filter(r => v(r) === 0)
      const oneTwo = src.filter(r => v(r) >= 1 && v(r) <= 2)
      const threePlus = src.filter(r => v(r) >= 3)
      buckets = [
        { key: '0', ids: zero.map(r => r.player_id) },
        { key: '1–2', ids: oneTwo.map(r => r.player_id) },
        { key: '≥3', ids: threePlus.map(r => r.player_id) },
      ]
    }

    const chartData = buckets.map((b, i) => ({ name: b.key, value: b.ids.length, fill: colors[i % colors.length], ids: b.ids }))
    const total = chartData.reduce((s, r) => s + r.value, 0)
    const legendItems = chartData.map(d => ({ label: d.name, pct: total ? clamp((d.value / total) * 100) : 0, color: d.fill, ids: d.ids }))
    const useCountForTop = /Presenze/i.test(metricLabel)
    const getCount = (r: any) => Number(r.value ?? r.count ?? 0)
    const getSortVal = (r: any) => useCountForTop ? getCount(r) : (isRate ? Number(r.percent || 0) : getCount(r))
    const sorted = [...src].sort((a, b) => getSortVal(b) - getSortVal(a))
    const topFive = sorted.slice(0, 5).map((r, idx) => ({
      rank: idx + 1,
      id: r.player_id,
      first_name: r.first_name,
      last_name: r.last_name,
      value: getCount(r),
    }))
    return { pieData: chartData, legend: legendItems, baseN: nPlayers, topFive }
  }, [distribution, metricLabel, variant])

  if (!item) {
    return (
      <Card className="p-4 bg-card/80 border border-border rounded-2xl shadow-card">
        <div className="text-sm">—</div>
      </Card>
    )
  }

  const p = item.player
  const value = (item.value ?? item.count ?? 0)
  const to = `/player/${p.id}`

  return (
    <div className="group [perspective:1000px] min-h-[240px] w-full">
      <div className={`relative h-full w-full [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        {/* Front */}
        <Link to={to} className="block absolute inset-0 [backface-visibility:hidden]">
          <Card className="p-0 bg-card/80 border border-border rounded-2xl shadow-card hover:shadow-glow transition-smooth h-full overflow-hidden" onClick={(e)=>{ e.preventDefault(); setFlipped(true) }}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-1 min-h-[30px]" style={{ backgroundColor: metricStyle.headerBg }}>
                <SectionIcon className="h-5 w-5 flex-shrink-0" style={{ color: metricStyle.accent }} aria-hidden />
                <div className="relative top-[2px] sm:top-0 line-clamp-2 font-semibold text-[14px] leading-tight" style={{ color: '#2B2B2B' }}>{metricLabel}</div>
              </div>
              {/* Hero */}
              <div className="relative flex-1 px-4 py-2 pb-3">
                {/* Gradient overlays: centered on mobile, anchored to avatar on >=lg */}
                <div className="pointer-events-none absolute inset-0 lg:hidden" style={{ backgroundImage: `radial-gradient(60% 60% at 50% 40%, ${metricStyle.accent}22 0%, transparent 70%)` }} />
                <div className="pointer-events-none absolute inset-0 hidden lg:block" style={{ backgroundImage: `radial-gradient(60% 60% at 15% 50%, ${metricStyle.accent}22 0%, transparent 70%)` }} />

                {/* Mobile (<=lg): centered stack */}
                <div className="lg:hidden flex h-full flex-col items-center justify-center text-center">
                  <div className="relative">
                    <PlayerAvatar entityId={`player:${p.id}`} firstName={p.first_name} lastName={p.last_name} avatarUrl={p.avatar_url || undefined} size="xl" className="h-16 w-16" />
                  </div>
                  <div className="mt-2 max-w-[85%] line-clamp-2 break-words font-semibold text-[20px]">{p.first_name} {p.last_name}</div>
                  <div className="mt-3 flex items-center justify-center mb-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full h-9 px-4" style={{ backgroundColor: metricStyle.headerBg }}>
                      <SectionIcon className="h-5 w-5" style={{ color: metricStyle.accent }} aria-hidden />
                      <span className="font-bold tabular-nums text-[24px]" style={{ color: metricStyle.accent }}>{value}</span>
                      <span className="text-[14px] lowercase" style={{ color: metricStyle.accent }}>{valueUnit}</span>
                    </div>
                  </div>
                </div>

                {/* >= lg: avatar left, text + pill right */}
                <div className="hidden lg:flex items-start gap-3">
                  <div className="relative flex items-center">
                    <div className="relative">
                      <PlayerAvatar entityId={`player:${p.id}`} firstName={p.first_name} lastName={p.last_name} avatarUrl={p.avatar_url || undefined} size="xl" className="h-16 w-16" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 max-w-full">
                        <div className="line-clamp-2 break-words font-semibold text-[20px]">{p.first_name} {p.last_name}</div>
                      </div>
                      <div className="hidden lg:flex items-center">
                        <div className="inline-flex items-center gap-1.5 rounded-full h-9 px-4" style={{ backgroundColor: metricStyle.headerBg }}>
                          <SectionIcon className="h-5 w-5" style={{ color: metricStyle.accent }} aria-hidden />
                          <span className="font-bold tabular-nums text-[22px]" style={{ color: metricStyle.accent }}>{value}</span>
                          <span className="text-[14px] lowercase" style={{ color: metricStyle.accent }}>{valueUnit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between h-7 text-[12px] px-4 mb-2" style={{ color: '#5A5A5A' }}>
                <span className="truncate">Tocca per vedere il confronto squadra.</span>
                <button onClick={(e)=>{ e.preventDefault(); setFlipped(true) }} className="hover:opacity-80" aria-label="Apri confronto squadra con flip">↻ Flip</button>
              </div>
            </div>
          </Card>
        </Link>
        {/* Back */}
        <Card className="p-4 bg-card/80 border-border hover:shadow-glow transition-smooth absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden relative">
          <div className="flex flex-col h-full pb-3">
            <div className="flex items-start justify-between">
              <div className="text-xs text-muted-foreground">{baseCaption}: {baseN}</div>
            </div>
            <div className="mt-2 flex-1 min-h-[8.5rem] flex flex-col lg:flex-row items-stretch gap-3">
              <div className="w-full lg:w-[48%] h-[120px] sm:h-[140px]">
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
              <div className="flex-1 h-full overflow-auto">
                <ol className="text-[11px] leading-5 text-muted-foreground">
                  {topFive?.map((t: any) => (
                    <li key={t.id} className="truncate">
                      {t.rank}) {(t.first_name?.[0] || '?')}. {t.last_name || ''} | {t.value}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="h-7 mb-2" />
          </div>
          <button className="absolute bottom-2 right-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1" onClick={()=>setFlipped(false)} aria-label="Torna al fronte">
            <span>back</span>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </Card>
      </div>
    </div>
  )
}

export default TopLeaderCard