import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type Chip = {
  label: string
  icon: ReactNode
  onClick?: () => void
  color?: 'primary'|'accent'|'success'|'warning'|'destructive'|'secondary'
}

export const StatChipBar = ({ chips }: { chips: Chip[] }) => {
  const colorToClass: Record<NonNullable<Chip['color']>, string> = {
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
  }
  return (
    <div className="-mx-2 sm:mx-0">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-2 sm:px-0">
        {chips.map((c, idx) => (
          <Button
            key={idx}
            variant="ghost"
            className={`rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-bounce border ${c.color ? colorToClass[c.color] : 'bg-muted text-foreground'} hover:scale-105 active:scale-95`}
            onClick={c.onClick}
            title={c.label}
          >
            <span className="inline-flex items-center gap-2">
              {c.icon}
              <span className="text-xs sm:text-sm whitespace-nowrap">{c.label}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export default StatChipBar
