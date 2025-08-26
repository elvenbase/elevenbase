import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { useRoles } from '@/hooks/useRoles'
import { RotateCcw, Search, CalendarCheck2, CalendarX, AlarmClock, MailX, CornerDownRight, Timer, Trophy, SquareMinus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react'
import { PieChart as RePieChart, Pie as RePie, Cell as ReCell, Tooltip as ReTooltip, ResponsiveContainer as ReResponsiveContainer } from 'recharts'
import { useAvatarBackgrounds } from '@/hooks/useAvatarBackgrounds'


type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null; jersey_number?: number | null }

type Props = {
  metricLabel: string
  valueUnit: string
  variant?: 'training' | 'lates' | 'matches' | 'no_response' | 'absences' | 'goals' | 'assists' | 'minutes' | 'saves' | 'yellow' | 'red' | 'neutral' | 'score_best' | 'score_worst'
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
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
          }
        },
        { threshold: 0.1 }
      )
      
      if (ref.current) {
        observer.observe(ref.current)
      }
      
      return () => observer.disconnect()
    }, [isVisible])
    
    useEffect(() => {
      if (!isVisible) return
      
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
    }, [value, isVisible])
    
    return <span ref={ref} className={`tabular-nums ${bump ? 'animate-pulse' : ''}`}>{display}</span>
  }

  const [flipped, setFlipped] = useState(false)

  // Metric color/icon style map (hex tints per spec)
  const metricStyle = (() => {
    switch (variant) {
      case 'training':
        return { headerBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', accent: '#22c55e', icon: CalendarCheck2 } // Verde morbido con sfumatura
      case 'matches':
        return { headerBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', accent: '#22c55e', icon: CalendarCheck2 } // Verde morbido con sfumatura
      case 'lates':
        return { headerBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', accent: '#f59e0b', icon: AlarmClock } // Giallo morbido con sfumatura
      case 'no_response':
        return { headerBg: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', accent: '#ef4444', icon: MailX } // Rosso morbido con sfumatura
      case 'absences':
        return { headerBg: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', accent: '#f97316', icon: CalendarX } // Arancione morbido con sfumatura
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

  // React Hooks must be called at the top level, before any conditional returns
  const [computedMin, setComputedMin] = useState<number | null>(null)
  const [vw, setVw] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0)
  const { defaultAvatarImageUrl } = useAvatarBackgrounds()

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
  const imageSrc = (p.avatar_url || defaultAvatarImageUrl || '') as string

  // Use metric-specific background for presence cards, role-based for others
  const isPresenceCard = ['training', 'matches', 'lates', 'absences', 'no_response'].includes(variant)
  const isPerformanceCard = ['goals', 'assists', 'yellow', 'red'].includes(variant)
  const cardBgClass = (isPresenceCard || isPerformanceCard)
    ? `from-transparent to-transparent` 
    : sectorHeroBgClass[sectorFromRoleCode(p.role_code || '')]

  return (
    <div className="w-full">
      {/* Front, aligned to /squad card */}
      <Link to={to} className="block">
        <Card className={`relative rounded-lg border border-border/40 shadow-sm bg-white hover:shadow-md transition hover:-translate-y-0.5 overflow-visible bg-gradient-to-r ${cardBgClass}`} style={(isPresenceCard || isPerformanceCard) ? { background: metricStyle.headerBg } : {}}>
          <div className="relative p-[0.9rem]">
            {/* Avatar overflowing left - Clean square with no background */}
            {imageSrc ? (
              <div className="absolute -top-4 left-0 md:-top-6 md:left-0 w-[96px] h-[96px] md:w-[130px] md:h-[130px] overflow-hidden">
                <img
                  src={imageSrc}
                  alt={`${p.first_name} ${p.last_name}`}
                  className="w-full h-full object-cover object-center select-none"
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
                      // Show initials fallback
                      const fallbackDiv = img.parentElement?.parentElement?.querySelector('.avatar-initials-fallback') as HTMLElement
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'flex'
                      }
                    }
                  }}
                  draggable={false}
                />
              </div>
            ) : (
              <div className="absolute -top-4 left-0 md:-top-6 md:left-0 w-[96px] h-[96px] md:w-[130px] md:h-[130px] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center avatar-initials-fallback">
                <span className="text-lg md:text-2xl font-semibold text-blue-600">
                  {p.first_name?.[0]}{p.last_name?.[0]}
                </span>
              </div>
            )}
            {/* Right content padding to accommodate avatar */}
            <div className="pl-[125px] min-h-[88px] md:min-h-[142px] pr-2">
              <div className="space-y-2">
                {/* Two-line name: Nome, a capo Cognome */}
                <div className="font-semibold text-lg md:text-xl leading-tight">
                  <div className="truncate">{p.first_name}</div>
                  <div className="truncate">{p.last_name}</div>
                </div>
                {/* Role and jersey number on same line (mapped via roles) */}
                <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                  <span className="truncate">
                    {p.role_code ? `${roleLabelByCode.get(p.role_code) || p.role_code}` : '—'}
                  </span>
                  {typeof (p as any).jersey_number === 'number' && (
                    <span>#{(p as any).jersey_number}</span>
                  )}
                </div>
                {/* Simple metric: icon + number + unit (no chip/border/bg) */}
                <div className="mt-1 inline-flex items-center gap-2 text-sm">
                  {!!SectionIcon && <SectionIcon className="h-5 w-5" style={{ color: metricStyle.accent }} aria-hidden />}
                  <span className="font-extrabold tabular-nums text-[18px] md:text-[20px]" style={{ color: metricStyle.accent }}>
                    <AnimatedNumber value={Math.max(0, Math.round(Number(value) || 0))} />
                  </span>
                  <span className="lowercase text-[0.95em]" style={{ color: metricStyle.accent }}>{valueUnit}</span>
                </div>
              </div>
            </div>
            
            {/* Horizontal separator line */}
            <div className="border-t border-border mt-2 mb-2"></div>
            
            {/* Top 5 leaderboard table */}
            <div className="px-4 pb-4">
              <div className="text-xs font-semibold text-muted-foreground mb-3">Top 5</div>
              {distribution && distribution.length > 0 ? (
                <div className="space-y-1.5">
                  {distribution.slice(0, 5).map((entry, index) => (
                    <div key={`${entry.player_id}-${index}`} className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium truncate flex-1 pr-2">
                        {entry.first_name} {entry.last_name}
                      </span>
                      <span className="font-bold tabular-nums text-muted-foreground">
                        <AnimatedNumber value={Math.round(Number(entry.value || entry.count || 0))} />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Nessun dato disponibile</div>
              )}
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
                      <div className="font-semibold">
                        {typeof meta.opportunities === 'number' ? <AnimatedNumber value={meta.opportunities} /> : '—'}
                      </div>
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
                            <span className="font-semibold tabular-nums">
                              <AnimatedNumber value={isNaN(it.value) ? 0 : it.value} />
                            </span>
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