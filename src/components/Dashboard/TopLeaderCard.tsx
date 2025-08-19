import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null }

type Props = {
  metricLabel: string
  valueUnit: string
  variant?: 'training' | 'lates' | 'matches' | 'no_response' | 'goals' | 'assists' | 'minutes' | 'saves' | 'yellow' | 'red' | 'neutral'
  item?: { player: PlayerRef; value?: number; percent?: number; count?: number } | null
}

export const TopLeaderCard = ({ metricLabel, valueUnit, variant = 'neutral', item }: Props) => {
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
    <Link to={to} className="group block">
      <Card className={`p-4 ${theme.cardBg} bg-card/80 border-border hover:shadow-glow transition-smooth`}>
        <div className="flex items-center justify-between gap-3">
          {/* Left: Avatar + Name + Metric label */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <PlayerAvatar
                firstName={p.first_name}
                lastName={p.last_name}
                avatarUrl={p.avatar_url || undefined}
                size="md"
                className="animate-in fade-in-0"
              />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-extrabold text-foreground truncate">{p.first_name} {p.last_name}</div>
              <div className="text-xs text-muted-foreground truncate">{metricLabel}</div>
            </div>
          </div>
          {/* Right: Big pill with value + unit + award icon */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme.pillBg} ${theme.pillText} text-base sm:text-lg font-extrabold transition-smooth group-hover:scale-105`}>
            <Award className="h-4 w-4" />
            <span className="text-foreground"><AnimatedNumber value={value} /></span>
            <span className="text-foreground text-sm sm:text-base font-semibold">{` ${valueUnit}`}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default TopLeaderCard

