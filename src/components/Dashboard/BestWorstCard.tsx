import { Card } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type PlayerRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null; role_code?: string | null }

type Props = {
  title: string
  metricLabel: string
  best?: { player: PlayerRef; value: number; percent?: number } | null
  worst?: { player: PlayerRef; value: number; percent?: number } | null
}

export const BestWorstCard = ({ title, metricLabel, best, worst }: Props) => {
  const Item = ({ kind, data }: { kind: 'best'|'worst'; data?: { player: PlayerRef; value: number; percent?: number } | null }) => {
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
              <div className="text-xs text-muted-foreground">{metricLabel}: <span className="text-foreground font-semibold">{data.value}{typeof data.percent === 'number' ? ` (${data.percent}%)` : ''}</span></div>
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
