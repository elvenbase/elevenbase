import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null }

type Props = {
  title: string
  metricLabel: string
  best?: { player: PlayerRef; value: number; percent?: number } | null
  worst?: { player: PlayerRef; value: number; percent?: number } | null
}

export const BestWorstCard = ({ title, metricLabel, best, worst }: Props) => {
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
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
        <div className="text-xs text-muted-foreground">{kind === 'best' ? 'Migliore' : 'Peggiore'}</div>
        <div className="text-xs text-muted-foreground">Nessun dato</div>
      </div>
    )
    const p = data.player
    const to = `/player/${p.id}`
    return (
      <Link to={to} className="group block">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-smooth">
          <div className="flex items-center gap-3">
            <PlayerAvatar firstName={p.first_name} lastName={p.last_name} avatarUrl={p.avatar_url || undefined} size="md" />
            <div>
              <div className="text-sm font-medium text-foreground">{p.first_name} {p.last_name}</div>
              <div className="text-xs text-muted-foreground">{metricLabel}: <AnimatedNumber value={(data.value ?? data.count ?? 0)} suffix={typeof data.percent === 'number' ? ` (${data.percent}%)` : ''} /></div>
            </div>
          </div>
          {kind === 'best' ? (
            <ArrowUpRight className="h-4 w-4 text-success group-hover:scale-110 transition-smooth" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-destructive group-hover:scale-110 transition-smooth" />
          )}
        </div>
      </Link>
    )
  }
  return (
    <Card className="p-4 bg-card border-border">
      <div className="text-sm font-semibold text-foreground mb-3">{title}</div>
      <div className="space-y-2">
        <Item kind="best" data={best || null} />
        <Item kind="worst" data={worst || null} />
      </div>
    </Card>
  )
}

export default BestWorstCard
