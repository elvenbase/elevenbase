import React, { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react'
import { useAvatarBackgrounds } from '@/hooks/useAvatarBackgrounds'

interface SquadScorePlayer {
  player_id: string
  first_name: string
  last_name: string
  value: number
  rank?: number
}

interface SquadScoreCardProps {
  type: 'best' | 'worst'
  player: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string | null
    role_code?: string | null
    jersey_number?: number | null
  }
  score: number
  leaderboard: SquadScorePlayer[]
  totalEvents: number
  averageScore: number
}

const AnimatedNumber = ({ 
  value, 
  isVisible, 
  className = "",
  suffix = "" 
}: { 
  value: number
  isVisible: boolean
  className?: string
  suffix?: string
}) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const duration = 1500
    const steps = 60
    const stepValue = value / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setDisplayValue(Math.min(stepValue * currentStep, value))
      
      if (currentStep >= steps) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value, isVisible])

  return (
    <span className={className}>
      {Math.round(displayValue)}{suffix}
    </span>
  )
}

const sectorFromRoleCode = (roleCode: string | null | undefined): string => {
  if (!roleCode) return 'unknown'
  const code = roleCode.toLowerCase()
  if (['p', 'por'].includes(code)) return 'goalkeeper'
  if (['dc', 'dd', 'ds', 'ddc', 'ddd', 'dds', 'cb', 'rb', 'lb', 'cwb', 'wb'].includes(code)) return 'defender'
  if (['mc', 'mdc', 'mdd', 'mds', 'cc', 'cm', 'cdm', 'cam', 'rm', 'lm', 'dm', 'am'].includes(code)) return 'midfielder'
  if (['a', 'att', 'cf', 'st', 'lw', 'rw', 'ss', 'f', 'ala', 'ali'].includes(code)) return 'forward'
  return 'unknown'
}

const sectorHeroBgClass = (sector: string, type: 'best' | 'worst'): string => {
  const baseClass = type === 'best' 
    ? 'from-green-50 via-emerald-50 to-teal-50' 
    : 'from-red-50 via-orange-50 to-yellow-50'
  
  switch (sector) {
    case 'goalkeeper': return baseClass
    case 'defender': return baseClass
    case 'midfielder': return baseClass
    case 'forward': return baseClass
    default: return baseClass
  }
}

export const SquadScoreCard: React.FC<SquadScoreCardProps> = ({
  type,
  player,
  score,
  leaderboard,
  totalEvents,
  averageScore
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { defaultAvatarImageUrl } = useAvatarBackgrounds()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const sector = sectorFromRoleCode(player.role_code)
  const heroBg = sectorHeroBgClass(sector, type)
  
  const scoreColor = type === 'best' ? 'text-green-600' : 'text-red-600'
  const iconColor = type === 'best' ? 'text-green-500' : 'text-red-500'
  const borderColor = type === 'best' ? 'border-green-200' : 'border-red-200'
  
  // Avatar with fallback logic
  const imageSrc = (player.avatar_url || defaultAvatarImageUrl || '') as string

  return (
    <Card ref={cardRef} className={`overflow-hidden ${borderColor} border-2 hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-0">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${heroBg} p-4 border-b`}>
          <div className="flex items-center gap-3">
            {type === 'best' ? (
              <TrendingUp className={`h-6 w-6 ${iconColor}`} />
            ) : (
              <TrendingDown className={`h-6 w-6 ${iconColor}`} />
            )}
            <h3 className="font-semibold text-lg">
              {type === 'best' ? 'Score Migliore' : 'Score Peggiore'}
            </h3>
          </div>
        </div>

        {/* Desktop: Layout verticale a 3 righe */}
        <div className="hidden md:block">
          {/* Riga 1: Player Info */}
          <div className="p-6 border-b">
            <Link 
              to={`/player/${player.id}?ref=/dashboard`}
              className="block group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted shrink-0">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={`${player.first_name} ${player.last_name}`}
                      className="w-full h-full object-cover"
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
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </span>
                  </div>
                </div>

                {/* Player Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xl group-hover:text-primary transition-colors">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {player.role_code && player.jersey_number 
                      ? `${player.role_code} #${player.jersey_number}`
                      : player.role_code || `#${player.jersey_number}` || 'N/A'
                    }
                  </div>
                </div>

                {/* Score prominente */}
                <div className="text-right">
                  <div className={`text-4xl font-bold ${scoreColor}`}>
                    <AnimatedNumber value={score} isVisible={isVisible} suffix=" pt" />
                  </div>
                  <div className="text-sm text-muted-foreground">Squad Score</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Riga 2: Statistiche Estese */}
          <div className="p-6 border-b">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Statistiche Dettagliate</h4>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Eventi totali</div>
                  <div className="font-semibold text-lg">
                    <AnimatedNumber value={totalEvents} isVisible={isVisible} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Media squadra</div>
                  <div className="font-semibold text-lg">
                    <AnimatedNumber value={averageScore} isVisible={isVisible} suffix=" pt" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {score > averageScore ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Differenza dalla media</div>
                  <div className={`font-semibold text-lg ${score > averageScore ? 'text-green-600' : 'text-red-600'}`}>
                    {score > averageScore ? '+' : ''}
                    <AnimatedNumber value={score - averageScore} isVisible={isVisible} suffix=" pt" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Riga 3: Top 5 Leaderboard */}
          <div className="p-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Top 5 Classifica</h4>
            <div className="grid grid-cols-1 gap-3">
              {leaderboard.slice(0, 5).map((player, index) => (
                <div key={player.player_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {player.rank || index + 1}°
                    </span>
                    <span className="font-medium">
                      {player.first_name} {player.last_name}
                    </span>
                  </div>
                  <span className="font-bold text-lg">
                    {Math.round(player.value)} pt
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Layout verticale */}
        <div className="md:hidden">
          {/* Player Info */}
          <div className="p-4 border-b">
            <Link 
              to={`/player/${player.id}?ref=/dashboard`}
              className="block group"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={`${player.first_name} ${player.last_name}`}
                      className="w-full h-full object-cover"
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
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold group-hover:text-primary transition-colors">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {player.role_code && player.jersey_number 
                      ? `${player.role_code} #${player.jersey_number}`
                      : player.role_code || `#${player.jersey_number}` || 'N/A'
                    }
                  </div>
                </div>

                <div className={`text-2xl font-bold ${scoreColor}`}>
                  <AnimatedNumber value={score} isVisible={isVisible} suffix=" pt" />
                </div>
              </div>
            </Link>
          </div>

          {/* Metriche Essenziali */}
          <div className="p-4 border-b">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Eventi</div>
                <div className="font-semibold">
                  <AnimatedNumber value={totalEvents} isVisible={isVisible} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">vs Media</div>
                <div className={`font-semibold ${score > averageScore ? 'text-green-600' : 'text-red-600'}`}>
                  {score > averageScore ? '+' : ''}
                  <AnimatedNumber value={score - averageScore} isVisible={isVisible} suffix=" pt" />
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Compatto */}
          <div className="p-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Top 5</h4>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 3).map((player, index) => (
                <div key={player.player_id} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      {player.rank || index + 1}°
                    </span>
                    <span className="text-sm truncate">
                      {player.first_name} {player.last_name}
                    </span>
                  </div>
                  <span className="text-sm font-medium ml-2">
                    {Math.round(player.value)} pt
                  </span>
                </div>
              ))}
              {leaderboard.length > 3 && (
                <div className="text-xs text-muted-foreground text-center pt-1">
                  +{leaderboard.length - 3} altri...
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}