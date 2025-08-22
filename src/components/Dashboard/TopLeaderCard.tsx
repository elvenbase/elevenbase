import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { useRoles } from '@/hooks/useRoles'
import { RotateCcw, Search, CalendarCheck2, CalendarX, AlarmClock, MailX, CornerDownRight, Timer, Trophy, SquareMinus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { PieChart as RePieChart, Pie as RePie, Cell as ReCell, Tooltip as ReTooltip, ResponsiveContainer as ReResponsiveContainer } from 'recharts'
import { useAvatarBackgrounds } from '@/hooks/useAvatarBackgrounds'

type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null; jersey_number?: number | null }

type Props = {
  metricLabel: string
  valueUnit: string
  variant?: 'training' | 'lates' | 'matches' | 'no_response' | 'goals' | 'assists' | 'minutes' | 'saves' | 'yellow' | 'red' | 'neutral' | 'score_best' | 'score_worst'
  item?: { player: PlayerRef; value?: number; percent?: number; count?: number; meta?: any } | null
  distribution?: Array<{ player_id: string; value?: number; count?: number; percent?: number; first_name?: string; last_name?: string }>
  onSegmentOpen?: (filter: { label: string; playerIds: string[] }) => void
}

export const TopLeaderCard = ({ metricLabel, valueUnit, variant = 'neutral', item, distribution = [], onSegmentOpen }: Props) => {
  const { data: roles = [] } = useRoles()
  const roleLabelByCode = useMemo(() => {
    const m = new Map<string, string>()
    roles.forEach(r => m.set(r.code, r.label))
    return m
  }, [roles])
  // Role → sector mapping for card background theme (aligned to /squad)
  const sectorFromRoleCode = (code?: string): 'P'|'DIF'|'CEN'|'ATT'|'NA' => {
    if (!code) return 'NA'
    const c = code.toUpperCase()
    if (c === 'P') return 'P'
    if (['TD','DC','DCD','DCS','TS'].includes(c)) return 'DIF'
    if (['MC','MED','REG','MD','MS','ED','ES','QD','QS'].includes(c)) return 'CEN'
    if (['PU','ATT','AD','AS'].includes(c)) return 'ATT'
    return 'NA'
  }
  const sectorHeroBgClass: Record<'P'|'DIF'|'CEN'|'ATT'|'NA', string> = {
    P: 'from-sky-500/20 to-sky-500/5',
    DIF: 'from-emerald-500/20 to-emerald-500/5',
    CEN: 'from-amber-500/25 to-amber-500/5',
    ATT: 'from-rose-500/25 to-rose-500/5',
    NA: 'from-neutral-500/20 to-neutral-500/5'
  }
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
      case 'score_best':
        return { headerBg: '#E8F6EE', accent: '#2EB872', icon: null as any }
      case 'score_worst':
        return { headerBg: '#FFE9EB', accent: '#D83A3A', icon: null as any }
      default: {
        const isAbs = /Assenze/i.test(metricLabel)
        if (isAbs) return { headerBg: '#F7F1E6', accent: '#A77D2C', icon: CalendarX }
        return { headerBg: '#F3F4F6', accent: '#334155', icon: Trophy }
      }
    }
  })()
  const SectionIcon = metricStyle.icon as any
  const isScoreVariant = variant === 'score_best' || variant === 'score_worst'

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
        if (/score/i.test(lower)) return 'Score calcolato su allenamenti e partite'
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
    const legendItems = chartData.map(d => ({ label: d.name, pct: total ? Math.max(0, Math.min(100, Math.round((d.value / total) * 100))) : 0, color: d.fill, ids: d.ids }))
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
  const to = `/player/${p.id}?ref=/dashboard`

  const [computedMin, setComputedMin] = useState<number | null>(null)
  const [vw, setVw] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0)
  const { defaultAvatarImageUrl } = useAvatarBackgrounds()
  const imageSrc = (p.avatar_url || defaultAvatarImageUrl || '') as string
  useLayoutEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useLayoutEffect(() => {
    // Base min heights per spec (+30px)
    const base = vw >= 900 ? 290 : 230
    // Estimate content height: header (≈30) + footer (≈28) + content blocks (avatar/name/chip/role/pill ≈ 160)
    // We'll cap to at least base and allow growth if content exceeds base
    const estimate = base
    setComputedMin(estimate)
  }, [vw, item])

  return (
    <div className="w-full">
      {/* Front, aligned to /squad card */}
      <Link to={to} className="block">
        <Card className={`relative rounded-lg border border-border/40 shadow-sm bg-white hover:shadow-md transition hover:-translate-y-0.5 overflow-visible bg-gradient-to-r ${sectorHeroBgClass[sectorFromRoleCode(p.role_code || '')]}`}>
          <div className="relative p-4 md:p-5">
            {/* Avatar overflowing left (identico a /squad) */}
            {imageSrc ? (
              <div className="absolute -top-4 left-0 md:-top-6 md:left-0 w-[108px] h-[144px] md:w-[144px] md:h-[180px] overflow-hidden rounded-sm border-0 ring-0">
                <img
                  src={imageSrc}
                  alt={`${p.first_name} ${p.last_name}`}
                  className="w-full h-full object-cover object-center select-none border-0 ring-0 outline-none"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    // Prevent infinite loop by applying fallback only once
                    const fallback = defaultAvatarImageUrl || ''
                    const already = (img as any).dataset.fallbackApplied === '1'
                    if (!already && fallback && img.src !== fallback) {
                      ;(img as any).dataset.fallbackApplied = '1'
                      img.src = fallback
                    } else {
                      img.style.display = 'none'
                    }
                  }}
                  draggable={false}
                />
              </div>
            ) : (
              <div className="absolute top-4 left-0 md:top-6 md:left-0">
                <PlayerAvatar entityId={`player:${p.id}`} firstName={p.first_name} lastName={p.last_name} avatarUrl={p.avatar_url || undefined} size="lg" />
              </div>
            )}
            {/* Right content padding to accommodate avatar */}
            <div className="pl-[109.6px] md:pl-[146.4px] min-h-[144px] md:min-h-[180px] pr-2">
              <div className="space-y-2">
                <div className="font-semibold text-lg md:text-xl leading-tight line-clamp-2">{p.first_name} {p.last_name}</div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-xs md:text-sm text-muted-foreground truncate">{roleLabelByCode.get(p.role_code || '') || (p.role_code || '—')}</div>
                  {typeof (p as any).jersey_number === 'number' && (
                    <Badge variant="outline" className="text-[10px]">#{(p as any).jersey_number}</Badge>
                  )}
                </div>
                {/* Metric pill: icon + animated number + unit */}
                <div className="mt-1">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm bg-white/85 border shadow-sm">
                    {!!SectionIcon && <SectionIcon className="h-5 w-5" style={{ color: metricStyle.accent }} aria-hidden />}
                    <span className="font-extrabold tabular-nums text-[18px] md:text-[20px]" style={{ color: metricStyle.accent }}>
                      <AnimatedNumber value={Math.max(0, Math.round(Number(value) || 0))} />
                    </span>
                    <span className="lowercase" style={{ color: metricStyle.accent }}>{valueUnit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
      {/* Back */}
      <Card className="hidden">
        {isScoreVariant ? (
          <div className="flex flex-col h-full pb-3">
            <div className="mb-2">
              <div className="text-sm font-semibold">Dettagli punteggio</div>
              <div className="text-xs text-muted-foreground">Parametri che hanno contribuito allo score</div>
            </div>
            {(() => {
              const meta = (item as any)?.meta || {}
              const pct = (n: number) => `${Math.round((n || 0) * 100)}%`
              return (
                <div className="flex-1 grid grid-cols-2 gap-3 text-[12px]">
                  <div className="space-y-2">
                    <div className="rounded-lg border p-2">
                      <div className="text-muted-foreground">Opportunità totali</div>
                      <div className="font-semibold">{meta.opportunities ?? '—'}</div>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-muted-foreground">Punti grezzi</div>
                      <div className="font-semibold">{typeof meta.pointsRaw === 'number' ? meta.pointsRaw.toFixed(2) : '—'}</div>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-muted-foreground">Tasso no response complessivo</div>
                      <div className="font-semibold">{pct(meta.noResponseRate || 0)}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border p-2">
                      <div className="text-muted-foreground">Percentuale presenze alle partite</div>
                      <div className="font-semibold">{pct(meta.matchPresenceRate || 0)}</div>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-muted-foreground">Tasso ritardi alle partite</div>
                      <div className="font-semibold">{pct(meta.matchLateRate || 0)}</div>
                    </div>
                  </div>
                  <div className="col-span-2 mt-1 -mx-4 pr-2 sm:pr-3">
                    <ul className="space-y-1 text-[12px] m-0 p-0 pl-[10px] list-none">
                      {(() => {
                        const EXCLUDE = new Set(['pointsRaw', 'opportunities', 'noResponseRate', 'matchPresenceRate', 'matchLateRate'])
                        const LABELS: Record<string, string> = {
                          T_P: 'Presenze allenamenti',
                          T_L: 'Ritardi allenamenti',
                          T_A: 'Assenze allenamenti',
                          T_NR: 'No response allenamenti',
                          M_P: 'Presenze partite',
                          M_L: 'Ritardi partite',
                          M_A: 'Assenze partite',
                          M_NR: 'No response partite',
                          mvpAwards: 'MVP',
                        }
                        const ORDER = ['T_P','T_L','T_A','T_NR','M_P','M_L','M_A','M_NR','mvpAwards']
                        const items: Array<{ label: string; value: number; key: string }> = []
                        ORDER.forEach(k => {
                          if (typeof meta[k] === 'number') items.push({ key: k, label: LABELS[k] || k, value: Number(meta[k]) })
                        })
                        for (const [k, v] of Object.entries(meta)) {
                          if (EXCLUDE.has(k) || ORDER.includes(k)) continue
                          if (typeof v !== 'number') continue
                          const friendly = LABELS[k] || k.replace(/_/g, ' ')
                          items.push({ key: k, label: friendly, value: Number(v) })
                        }
                        return items.map((it, i) => (
                          <li key={it.key || i} className="flex items-center justify-between border-b border-border/30 py-0.5">
                            <span className="text-muted-foreground">{it.label}</span>
                            <span className="font-semibold tabular-nums">{isNaN(it.value) ? 0 : it.value}</span>
                          </li>
                        ))
                      })()}
                    </ul>
                  </div>
                </div>
              )
            })()}
            <div className="h-7 mb-2" />
          </div>
        ) : (
          <div className="hidden" />
        )}
      </Card>
    </div>
  )
}

export default TopLeaderCard