import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null }

type Props = {
  title: string
  metricLabel: string
  icon?: LucideIcon
  variant?: 'training' | 'lates' | 'matches' | 'no_response' | 'goals' | 'assists' | 'minutes' | 'saves' | 'yellow' | 'red' | 'neutral'
  best?: { player: PlayerRef; value: number; percent?: number } | null
  worst?: { player: PlayerRef; value: number; percent?: number } | null
}

export const BestWorstCard = ({ title, metricLabel, icon: SectionIcon, variant = 'neutral', best, worst }: Props) => {
  const theme = (() => {
    switch (variant) {
      case 'training':
        return {
          bg: 'bg-success/10',
          headerIcon: 'text-success',
          chipBg: 'bg-success/15',
          chipText: 'text-success',
          ring: 'ring-success',
        }
      case 'lates':
        return {
          bg: 'bg-warning/10',
          headerIcon: 'text-warning',
          chipBg: 'bg-warning/15',
          chipText: 'text-warning',
          ring: 'ring-warning',
        }
      case 'matches':
        return {
          bg: 'bg-accent/10',
          headerIcon: 'text-accent',
          chipBg: 'bg-accent/15',
          chipText: 'text-accent',
          ring: 'ring-accent',
        }
      case 'no_response':
        return {
          bg: 'bg-muted/30',
          headerIcon: 'text-muted-foreground',
          chipBg: 'bg-muted',
          chipText: 'text-muted-foreground',
          ring: 'ring-muted',
        }
      case 'goals':
        return { bg: 'bg-primary/10', headerIcon: 'text-primary', chipBg: 'bg-primary/15', chipText: 'text-primary', ring: 'ring-primary' }
      case 'assists':
        return { bg: 'bg-accent/10', headerIcon: 'text-accent', chipBg: 'bg-accent/15', chipText: 'text-accent', ring: 'ring-accent' }
      case 'minutes':
        return { bg: 'bg-secondary/10', headerIcon: 'text-secondary', chipBg: 'bg-secondary/15', chipText: 'text-secondary', ring: 'ring-secondary' }
      case 'saves':
        return { bg: 'bg-success/10', headerIcon: 'text-success', chipBg: 'bg-success/15', chipText: 'text-success', ring: 'ring-success' }
      case 'yellow':
        return { bg: 'bg-warning/10', headerIcon: 'text-warning', chipBg: 'bg-warning/15', chipText: 'text-warning', ring: 'ring-warning' }
      case 'red':
        return { bg: 'bg-destructive/10', headerIcon: 'text-destructive', chipBg: 'bg-destructive/15', chipText: 'text-destructive', ring: 'ring-destructive' }
      default:
        return { bg: 'bg-muted/20', headerIcon: 'text-foreground', chipBg: 'bg-muted', chipText: 'text-foreground', ring: 'ring-primary' }
    }
  })()
  const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [display, setDisplay] = useState(0)
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
      return () => cancelAnimationFrame(raf)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])
    return <span className="text-foreground font-semibold">{display}{suffix}</span>
  }
  const Item = ({ kind, data }: { kind: 'best'|'worst'; data?: { player: PlayerRef; value?: number; percent?: number; count?: number } | null }) => {
    if (!data) return (
      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40">
        <div className="text-xs text-muted-foreground">{kind === 'best' ? 'Migliore' : 'Peggiore'}</div>
        <div className="text-xs text-muted-foreground">Nessun dato</div>
      </div>
    )
    const p = data.player
    const to = `/player/${p.id}`
    return (
      <Link to={to} className="group block">
        <div className={`p-3 rounded-lg ${theme.bg} hover:bg-muted/60 transition-smooth`}> 
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <PlayerAvatar
                  firstName={p.first_name}
                  lastName={p.last_name}
                  avatarUrl={p.avatar_url || undefined}
                  size="md"
                  className={`ring-2 ${theme.ring} ring-offset-2 ring-offset-background group-hover:shadow-glow transition-smooth ${kind==='best' ? 'animate-glow-pulse' : ''}`}
                />
                {SectionIcon && (
                  <span className={`absolute -bottom-1 -right-1 inline-flex items-center justify-center h-4 w-4 rounded-full ${theme.chipBg} ${theme.chipText} ring-1 ring-white/40`}>
                    <SectionIcon className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{p.first_name} {p.last_name}</div>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${theme.chipBg} ${theme.chipText} text-xs font-semibold transition-smooth group-hover:scale-105`}>
              {kind === 'best' ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className="text-foreground">
                <AnimatedNumber value={(data.value ?? data.count ?? 0)} suffix={typeof data.percent === 'number' ? ` (${data.percent}%)` : ''} />
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="text-muted-foreground">{metricLabel}</div>
            <div className={`text-muted-foreground ${kind==='best' ? 'text-success' : 'text-destructive'}`}>{kind === 'best' ? 'Top' : 'Peggiore'}</div>
          </div>
        </div>
      </Link>
    )
  }
  return (
    <Card className={`p-4 bg-card/80 border-border hover:shadow-glow transition-smooth`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        {SectionIcon && <SectionIcon className={`h-4 w-4 ${theme.headerIcon}`} />}
        <span>{title}</span>
      </div>
      <div className="space-y-2">
        <Item kind="best" data={best || null} />
        <Item kind="worst" data={worst || null} />
      </div>
    </Card>
  )
}

export default BestWorstCard
