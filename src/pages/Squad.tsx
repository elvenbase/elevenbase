
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, BarChart3, MessageCircle, ChevronDown, ChevronUp, ArrowUpDown, Filter, Settings } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { usePlayersWithAttendance, useDeletePlayer, useUpdatePlayer, useLeaders, useAttendanceScoreSettings } from '@/hooks/useSupabaseData';
import { computeAttendanceScore } from '@/lib/attendanceScore'
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import { PlayerForm } from '@/components/forms/PlayerForm';
import EditPlayerForm from '@/components/forms/EditPlayerForm';
import PlayerStatsModal from '@/components/forms/PlayerStatsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';

import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Search, LayoutGrid, Rows, SlidersHorizontal, Plus, X, Eye, Info, Users } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAvatarBackgrounds } from '@/hooks/useAvatarBackgrounds'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useQueryClient } from '@tanstack/react-query'
import { BulkImportWizard } from '@/components/BulkImport'
import { ImportResult } from '@/services/bulkImportExecutor'

type SortField = 'name' | 'jersey_number' | 'role_code' | 'phone' | 'presences' | 'tardiness' | 'attendanceRate' | 'status';
type SortDirection = 'asc' | 'desc';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number?: number;
  role_code?: string;
  phone?: string;
  birth_date?: string;
  email?: string;
  esperienza?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'injured' | 'suspended';
  avatar_url?: string;
  presences?: number;
  tardiness?: number;
  attendanceRate?: number;
  totalEvents?: number;
  ea_sports_id?: string;
  gaming_platform?: string;
  platform_id?: string;
  is_captain?: boolean; // 🔧 NUOVO: Campo capitano (opzionale per compatibilità)
}



// Mobile Player Card Component
interface MobilePlayerCardProps {
  player: Player;
  onImageClick: (player: Player) => void;
  onDelete: (playerId: string) => void;
  formatWhatsAppLink: (phone: string, name: string) => string;
  getRoleLabel: (code?: string) => string;
  roles: Array<{ code: string; label: string; abbreviation: string }>
  onChangeRole: (playerId: string, roleCode: string) => Promise<void>
}

const MobilePlayerCard: React.FC<MobilePlayerCardProps> = ({ 
  player, 
  onImageClick, 
  onDelete, 
  formatWhatsAppLink,
  getRoleLabel,
  roles,
  onChangeRole
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Main Info - Always Visible - SIMPLIFIED */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <PlayerAvatar
            entityId={`player:${player.id}`}
            firstName={player.first_name}
            lastName={player.last_name}
            avatarUrl={player.avatar_url}
            size="lg"
            className="cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-lg flex-shrink-0"
            onClick={() => onImageClick(player)}
          />
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-tight">
                <a href={`/player/${player.id}`} className="hover:underline">{player.first_name} {player.last_name}</a>
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {player.jersey_number && (
                  <Badge variant="outline" className="text-xs">
                    #{player.jersey_number}
                  </Badge>
                )}
                {player.is_captain && (
                  <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700">(C)</Badge>
                )}
                <Badge 
                  variant={
                    player.status === 'active' ? 'default' :
                    player.status === 'injured' ? 'destructive' :
                    player.status === 'suspended' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {player.status === 'active' ? 'Attivo' :
                   player.status === 'inactive' ? 'Inattivo' :
                   player.status === 'injured' ? 'Infortunato' :
                   player.status === 'suspended' ? 'Squalificato' : player.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 h-10 w-10 p-0 mt-1"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t space-y-4">
          {/* Info Giocatore */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Informazioni Giocatore</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Ruolo</span>
                <div className="mt-1 flex items-center gap-2">
                  {isEditingRole ? (
                    <Select
                      value={(player as any).role_code || ''}
                      onValueChange={async (value) => {
                        await onChangeRole(player.id, value)
                        setIsEditingRole(false)
                      }}
                    >
                      <SelectTrigger className="h-8 w-[180px]"><SelectValue placeholder="Seleziona ruolo" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.code} value={r.code}>{r.label} ({r.abbreviation})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <div className="text-sm font-medium">{getRoleLabel((player as any).role_code)}</div>
                      <Button variant="outline" size="sm" onClick={() => setIsEditingRole(true)}>Modifica</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistiche */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Statistiche Allenamenti</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Presenze</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {player.presences || 0}/{player.totalEvents || 0}
                  </Badge>
                  {player.totalEvents > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({player.attendanceRate}%)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Ritardi</span>
                <div className="mt-1">
                  <Badge variant={player.tardiness > 0 ? "destructive" : "outline"} className="text-xs">
                    {player.tardiness || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Contatti</h4>
            {player.phone ? (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <span className="text-sm font-medium">{player.phone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 px-3"
                >
                  <a
                    href={formatWhatsAppLink(player.phone, player.first_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
                Telefono non specificato
              </div>
            )}
          </div>

          {/* Gaming Info */}
          {(player.ea_sport_id || player.gaming_platform) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Dati Gaming</h4>
              <div className="bg-muted/20 rounded-lg p-3 space-y-3">
                {player.ea_sport_id && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">EA Sports ID</span>
                    <div className="mt-1 font-mono text-sm bg-muted px-3 py-2 rounded border">
                      {player.ea_sport_id}
                    </div>
                  </div>
                )}
                {player.gaming_platform && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Piattaforma</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {player.gaming_platform}
                      </Badge>
                      {player.platform_id && (
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {player.platform_id}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Azioni</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <EditPlayerForm player={player} />
                <PlayerStatsModal player={player}>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistiche
                  </Button>
                </PlayerStatsModal>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina giocatore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Elimina giocatore</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione rimuoverà definitivamente <strong>{player.first_name} {player.last_name}</strong> dalla rosa della squadra. Tutti i dati associati verranno eliminati.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(player.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Elimina
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// Squad Score progress bar with on-scroll animation
const NeonPillProgress: React.FC<{
  value?: number
  indeterminate?: boolean
  showLabel?: boolean
  ariaLabel?: string
}> = ({ value, indeterminate = false, showLabel = true, ariaLabel = 'Squad Score' }) => {
  const [trackWidth, setTrackWidth] = React.useState(0)
  const [inView, setInView] = React.useState(false)
  const [visibleStripes, setVisibleStripes] = React.useState(0)
  const [targetVisibleStripes, setTargetVisibleStripes] = React.useState(0)
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  const [trackHeight, setTrackHeight] = React.useState(0)
  const INNER_MARGIN_PX = 3
  const STRIPE_THICKNESS_PX = 4
  const STRIPE_GAP_PX = 8
  const STRIPE_PERIOD_PX = STRIPE_THICKNESS_PX + STRIPE_GAP_PX // 12px
  const COS45 = Math.SQRT1_2
  const THICKNESS_PROJ_X = STRIPE_THICKNESS_PX / COS45
  const HORIZONTAL_PERIOD_X = STRIPE_PERIOD_PX / COS45
  const [labelValue, setLabelValue] = React.useState(0)
  const [infoOpen, setInfoOpen] = React.useState(false)

  // Fast count-up label (independent from stripe steps)
  React.useEffect(() => {
    if (!inView) return
    const target = Number.isFinite(value as number) ? Math.round(Math.max(0, Math.min(100, value as number))) : 0
    if (target <= labelValue) return
    const interval = window.setInterval(() => {
      setLabelValue((prev) => {
        const next = prev + 1
        return next >= target ? target : next
      })
    }, 10)
    return () => window.clearInterval(interval)
  }, [inView, value, labelValue])


  // Measure content width (exclude border and padding ≈ 8px total)
  React.useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setTrackWidth(Math.max(0, Math.floor(rect.width - (8 + INNER_MARGIN_PX * 2))))
      setTrackHeight(Math.max(0, Math.floor(rect.height - (INNER_MARGIN_PX * 2))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Observe visibility to start the animation
  React.useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      })
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Compute target stripes (floor to avoid partial last stripe)
  React.useEffect(() => {
    if (!inView) return
    const maxStripes = Math.max(1, Math.floor((trackWidth - THICKNESS_PROJ_X) / HORIZONTAL_PERIOD_X))
    const rawPct = Math.max(0, Math.min(100, Number.isFinite(value as number) ? (value as number) : 0))
    const target = Math.min(maxStripes, Math.max(0, Math.round((rawPct / 100) * maxStripes)))
    setTargetVisibleStripes(target)
  }, [value, inView, trackWidth])

  // Step-wise animation to reach target stripes
  React.useEffect(() => {
    if (!inView) return
    if (visibleStripes === targetVisibleStripes) return
    const timer = window.setInterval(() => {
      setVisibleStripes((prev) => {
        if (prev < targetVisibleStripes) return prev + 1
        if (prev > targetVisibleStripes) return prev - 1
        return prev
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [inView, targetVisibleStripes, visibleStripes])

  const maxStripes = Math.max(1, Math.floor((trackWidth - THICKNESS_PROJ_X) / HORIZONTAL_PERIOD_X))
  const visibleWidthPx = Math.max(0, Math.min(maxStripes, visibleStripes)) * HORIZONTAL_PERIOD_X + THICKNESS_PROJ_X
  const visibleWidthPct = trackWidth > 0 ? (visibleWidthPx / trackWidth) * 100 : 0
  const clipPathPolygon = trackWidth > 0 && trackHeight > 0
    ? `polygon(0px 0px, ${visibleWidthPx.toFixed(2)}px 0px, ${Math.max(0, visibleWidthPx - trackHeight).toFixed(2)}px ${trackHeight}px, 0px ${trackHeight}px)`
    : undefined

  const pctText = `${inView ? labelValue : 0}%`
  const ariaProps = indeterminate
    ? { role: 'progressbar', 'aria-label': ariaLabel, 'aria-valuemin': 0, 'aria-valuemax': 100 } as any
    : { role: 'progressbar', 'aria-label': ariaLabel, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.max(0, Math.min(100, value || 0)) } as any

  // Mask styles for crisp reversed diagonal stripes
  const stripeMaskStyle: React.CSSProperties = {
    WebkitMaskImage: `repeating-linear-gradient(-45deg, #000 0px, #000 ${STRIPE_THICKNESS_PX}px, transparent ${STRIPE_THICKNESS_PX}px, transparent ${STRIPE_PERIOD_PX}px)`,
    maskImage: `repeating-linear-gradient(-45deg, #000 0px, #000 ${STRIPE_THICKNESS_PX}px, transparent ${STRIPE_THICKNESS_PX}px, transparent ${STRIPE_PERIOD_PX}px)`,
    WebkitMaskRepeat: 'repeat',
    maskRepeat: 'repeat'
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs md:text-sm font-bold">
        <div className="flex items-center">
          <span
            style={{
              background: 'linear-gradient(90deg, rgba(0,191,255,0.6) 0%, rgba(0,191,255,1.0) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.25))'
            }}
          >
            Squad Score
          </span>
          <Popover open={infoOpen} onOpenChange={setInfoOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="ml-2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                style={{ width: 24, height: 24 }}
                onClick={(e)=>{ e.stopPropagation(); setInfoOpen((v)=> !v) }}
                onMouseDown={(e)=>{ e.stopPropagation() }}
                onTouchStart={(e)=>{ e.stopPropagation() }}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
          <PopoverContent align="start" alignOffset={-8 as any} sideOffset={8} className="w-72 text-xs relative translate-x-[-6px]">
            <button
              onClick={(e)=>{ e.stopPropagation(); setInfoOpen(false) }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              aria-label="Chiudi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="pr-6">
              Punteggio 0–100 basato su presenze/assenze/ritardi (allenamenti e partite) del mese corrente.
              {' '}Gestisci le regole in
              {' '}
              <a
                href="/admin/attendance-score"
                className="underline text-primary"
                onClick={(e)=>{ e.stopPropagation(); setInfoOpen(false) }}
              >
                Squad Score
              </a>.
            </div>
          </PopoverContent>
        </Popover>
        </div>
        <div className="text-[10px] font-normal text-muted-foreground mt-1">
          (mese corrente)
        </div>
      </div>
      {infoOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e)=>{ e.stopPropagation(); setInfoOpen(false) }}
          onTouchStart={(e)=>{ e.stopPropagation(); setInfoOpen(false) }}
        />
      )}
      <div className="flex items-center gap-3">
        {showLabel && (
          <div className="relative isolate shrink-0">
            <div
              className="tabular-nums font-extrabold leading-none select-none"
              style={{
                fontSize: '20px',
                background: 'linear-gradient(90deg, rgba(0,191,255,0.6) 0%, rgba(0,191,255,1.0) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.25))'
              }}
            >
              {pctText}
            </div>
          </div>
        )}
        <div
          ref={trackRef}
          className="relative w-full h-8 sm:h-8 rounded-full p-[2px] transition-shadow overflow-hidden"
          style={{
            border: '2px solid #00BFFF',
            boxShadow: '0 0 18px rgba(0,191,255,0.20)',
            background: '#020617',
          }}
          {...ariaProps}
        >
          {!indeterminate && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              {/* Visible portion, masked with thin reversed diagonal stripes and diagonal end edge */}
              <div className="absolute" style={{ inset: INNER_MARGIN_PX }}>
                <div
                  className="h-full"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,191,255,0.6) 0%, rgba(0,191,255,1.0) 100%)',
                    ...stripeMaskStyle,
                    clipPath: clipPathPolygon,
                    transition: 'clip-path 180ms ease-out'
                  }}
                />
              </div>
            </div>
          )}
          {indeterminate && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div
                  className="absolute"
                  style={{
                    inset: INNER_MARGIN_PX,
                    background: 'linear-gradient(90deg, rgba(0,191,255,0.6) 0%, rgba(0,191,255,1.0) 100%)',
                    ...stripeMaskStyle
                  }}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Squad = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const __now = new Date()
  const __defaultFrom = new Date(__now.getFullYear(), __now.getMonth(), 1)
  const __defaultTo = new Date(__now.getFullYear(), __now.getMonth() + 1, 0)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: __defaultFrom,
    to: __defaultTo
  });
  const [selectedCaptain, setSelectedCaptain] = useState<string>('none');
  const [captainInitialized, setCaptainInitialized] = useState(false); // 🔧 Flag per evitare loop
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card'|'table'>('card')
  const [openPlayerId, setOpenPlayerId] = useState<string|null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [captainDialogOpen, setCaptainDialogOpen] = useState(false)
  
  // Stato per bulk import wizard
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  
  // Stato per la modale dell'immagine del giocatore
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedPlayerImage, setSelectedPlayerImage] = useState<{
    src: string;
    name: string;
    fallback: string;
  } | null>(null);
  
  const { data: players = [], isLoading } = usePlayersWithAttendance(dateRange?.from, dateRange?.to);
  const { data: roles = [] } = useRoles();
  const rolesByCode = useMemo(() => Object.fromEntries(roles.map(r => [r.code, r])), [roles])
  const { defaultAvatarImageUrl } = useAvatarBackgrounds()
  
  // Team info per bulk import
  const teamId = localStorage.getItem('currentTeamId') || '';
  const teamName = localStorage.getItem('currentTeamName') || 'Team';

  // Squad Score computed like Dashboard using leaders + settings within the selected dateRange
  const { data: scoreSettings } = useAttendanceScoreSettings()
  const { data: leaders } = useLeaders({ startDate: dateRange?.from, endDate: dateRange?.to })
  const squadScoreByPlayer = React.useMemo(() => {
    if (!leaders) return {}
    const toCount = (arr: any[] | undefined, pid: string) => {
      const r = (arr || []).find((x: any) => x.player_id === pid)
      return Number(r?.value ?? r?.count ?? 0)
    }
    const weights = scoreSettings ? {
      trainingPresentOnTime: scoreSettings.training_present_on_time ?? 1.0,
      trainingPresentLate: scoreSettings.training_present_late ?? 0.6,
      trainingAbsent: scoreSettings.training_absent ?? -0.8,
      trainingNoResponse: scoreSettings.training_no_response ?? -1.0,
      matchPresentOnTime: scoreSettings.match_present_on_time ?? 2.5,
      matchPresentLate: scoreSettings.match_present_late ?? 1.5,
      matchAbsent: scoreSettings.match_absent ?? -2.0,
      matchNoResponse: scoreSettings.match_no_response ?? -2.5,
      mvpBonusOnce: scoreSettings.mvp_bonus_once ?? 5.0,
    } : undefined
    const minEvents = scoreSettings?.min_events || 10
    const ids = new Set<string>([
      ...(leaders.trainingPresences || []).map((x: any) => x.player_id),
      ...(leaders.trainingAbsences || []).map((x: any) => x.player_id),
      ...(leaders.trainingLates || []).map((x: any) => x.player_id),
      ...(leaders.trainingNoResponses || []).map((x: any) => x.player_id),
      ...(leaders.matchPresences || []).map((x: any) => x.player_id),
      ...(leaders.matchAbsences || []).map((x: any) => x.player_id),
      ...(leaders.matchLates || []).map((x: any) => x.player_id),
      ...(leaders.matchNoResponses || []).map((x: any) => x.player_id),
      ...(leaders.mvpAwards || []).map((x: any) => x.player_id),
    ])
    const map: Record<string, number> = {}
    for (const pid of ids) {
      const counters = {
        T_P: toCount(leaders.trainingPresences as any[], pid),
        T_L: toCount(leaders.trainingLates as any[], pid),
        T_A: toCount(leaders.trainingAbsences as any[], pid),
        T_NR: toCount(leaders.trainingNoResponses as any[], pid),
        M_P: toCount(leaders.matchPresences as any[], pid),
        M_L: toCount(leaders.matchLates as any[], pid),
        M_A: toCount(leaders.matchAbsences as any[], pid),
        M_NR: toCount(leaders.matchNoResponses as any[], pid),
        mvpAwards: toCount(leaders.mvpAwards as any[], pid),
      }
      const s = computeAttendanceScore(counters as any, weights as any, minEvents)
      if (s.opportunities >= minEvents) {
        map[pid] = Math.max(0, Math.min(100, Number(s.score0to100 || 0)))
      }
    }
    return map
  }, [leaders, scoreSettings])

  // Role -> sector mapping for card background theme
  const sectorFromRoleCode = (code?: string): 'P'|'DIF'|'CEN'|'ATT'|'NA' => {
    if (!code) return 'NA'
    const c = code.toUpperCase()
    if (c === 'P') return 'P'
    if (['TD','DC','DCD','DCS','TS'].includes(c)) return 'DIF'
    if (['MC','MED','REG','MD','MS','ED','ES','QD','QS'].includes(c)) return 'CEN'
    if (['PU','ATT','AD','AS'].includes(c)) return 'ATT'
    return 'NA'
  }
  const sectorBgClass: Record<'P'|'DIF'|'CEN'|'ATT'|'NA', string> = {
    P: 'from-sky-50 to-sky-25',
    DIF: 'from-emerald-50 to-emerald-25',
    CEN: 'from-amber-50 to-amber-25',
    ATT: 'from-rose-50 to-rose-25',
    NA: 'from-neutral-50 to-neutral-25'
  }

  const sectorChipClass: Record<'P'|'DIF'|'CEN'|'ATT'|'NA', string> = {
    P: 'bg-sky-100 text-sky-800 border-sky-200',
    DIF: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CEN: 'bg-amber-100 text-amber-800 border-amber-200',
    ATT: 'bg-rose-100 text-rose-800 border-rose-200',
    NA: 'bg-neutral-100 text-neutral-700 border-neutral-200'
  }

  // Hero-like gradient background by role (same scheme used in PlayerDetail)
  const sectorHeroBgClass: Record<'P'|'DIF'|'CEN'|'ATT'|'NA', string> = {
    P: 'from-sky-500/20 to-sky-500/5',
    DIF: 'from-emerald-500/20 to-emerald-500/5',
    CEN: 'from-amber-500/25 to-amber-500/5',
    ATT: 'from-rose-500/25 to-rose-500/5',
    NA: 'from-neutral-500/20 to-neutral-500/5'
  }

  // Compute only roles present among players for the filter
  const presentRoles = useMemo(() => {
    const counts: Record<string, number> = {}
    players.forEach((p:any) => {
      const rc = (p as any).role_code
      if (rc) counts[rc] = (counts[rc] || 0) + 1
    })
    return Object.entries(counts)
      .map(([code, count]) => ({ code, count, label: rolesByCode[code]?.label || code }))
      .sort((a,b) => a.label.localeCompare(b.label))
  }, [players, rolesByCode])

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = []
    if (roleFilter !== 'all') chips.push({ key: 'role', label: rolesByCode[roleFilter]?.label || roleFilter, onClear: () => setRoleFilter('all') })
    if (statusFilter !== 'all') chips.push({ key: 'status', label: statusFilter, onClear: () => setStatusFilter('all') })
    return chips
  }, [roleFilter, statusFilter, selectedCaptain, rolesByCode])

  const deletePlayer = useDeletePlayer();
  const updatePlayer = useUpdatePlayer();
  const [editingRolePlayerId, setEditingRolePlayerId] = useState<string|null>(null);

  // Funzione per cambiare il ruolo di un player
  const onChangeRole = async (playerId: string, roleCode: string) => {
    try {
      await updatePlayer.mutateAsync({
        id: playerId,
        role_code: roleCode
      });
      toast.success('Ruolo aggiornato con successo');
      setEditingRolePlayerId(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del ruolo:', error);
      toast.error('Errore nell\'aggiornamento del ruolo');
    }
  };

  // Carica capitano attuale al mount e quando cambiano i players
  React.useEffect(() => {
    const currentCaptain = players.find(p => p.is_captain);
    if (currentCaptain) {
      setSelectedCaptain(currentCaptain.id);
    } else {
      setSelectedCaptain('none');
    }
    setCaptainInitialized(true); // 🔧 Marca come inizializzato
  }, [players]);

  // Funzione per aggiornare il capitano
  const queryClient = useQueryClient()

  const updateCaptain = async (newCaptainId: string) => {
    try {
      const paramId = (!newCaptainId || newCaptainId === 'none') ? null : newCaptainId
      const teamId = localStorage.getItem('teamId')
      
      // Try RPC first (atomic)
      const rpcRes = await supabase.rpc('set_captain', { new_captain_id: paramId as any })
      if (rpcRes.error) {
        // If RPC is missing, fallback to direct updates
        const notFound = (rpcRes.error.message || '').toLowerCase().includes('could not find the function')
        if (!notFound) throw rpcRes.error
        
        // Fallback: unset previous captain(s) ONLY FOR THIS TEAM
        const { error: unsetErr } = await supabase
          .from('players')
          .update({ is_captain: false })
          .eq('is_captain', true)
          .eq('team_id', teamId) // 🔧 AGGIUNTO: Filtra per team
        if (unsetErr) throw unsetErr
        
        // Set new captain if provided
        if (paramId) {
          const { error: setErr } = await supabase
            .from('players')
            .update({ is_captain: true })
            .eq('id', paramId)
            .eq('team_id', teamId) // 🔧 AGGIUNTO: Sicurezza extra
          if (setErr) throw setErr
        }
      }

      if (paramId) {
        const captain = players.find(p => p.id === paramId);
        toast.success(`${captain?.first_name} ${captain?.last_name} è ora il capitano`);
      } else {
        toast.success('Nessun capitano selezionato');
      }
      // Refresh immediato
      queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['players'] })
      setCaptainDialogOpen(false)
    } catch (error) {
      console.error('🔥 ERRORE DETTAGLIATO CAPITANO:', {
        error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      toast.error(`Errore nell'aggiornamento del capitano: ${(error as any)?.message || error}`);
      // Revert UI state
      const currentCaptain = players.find(p => p.is_captain);
      setSelectedCaptain(currentCaptain?.id || 'none');
    }
  };

  // Salva quando cambia la selezione del capitano
  React.useEffect(() => {
    if (!captainInitialized) return; // 🔧 Non agire se non inizializzato
    
    const currentCaptain = players.find(p => p.is_captain);
    const currentCaptainId = currentCaptain?.id || 'none';
    
    // Solo se è cambiato davvero e non è il caricamento iniziale
    if (selectedCaptain !== currentCaptainId && players.length > 0) {
      updateCaptain(selectedCaptain);
    }
  }, [selectedCaptain, captainInitialized]);

  const formatWhatsAppLink = (phone: string, firstName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=Ciao%20${firstName}`;
  };

  const openImageModal = (player: Player) => {
    setSelectedPlayerImage({
      src: player.avatar_url || defaultAvatarImageUrl || '',
      name: `${player.first_name} ${player.last_name}`,
      fallback: `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`
    });
    setImageModalOpen(true);
  };



  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = players.filter(player => {
      const matchesSearch = 
        player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.jersey_number && player.jersey_number.toString().includes(searchTerm));
      
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      const matchesRole = roleFilter === 'all' || (rolesByCode[(player as any).role_code || '']?.code === roleFilter)
      
      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase();
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase();
          break;
        case 'jersey_number':
          aValue = a.jersey_number || 0;
          bValue = b.jersey_number || 0;
          break;
        case 'role_code':
          {
            const ra: any = rolesByCode[(a as any).role_code || ''];
            const rb: any = rolesByCode[(b as any).role_code || ''];
            // Primary by sort_order if both exist, else by label, else by code
            if (ra && rb) {
              aValue = ra.sort_order;
              bValue = rb.sort_order;
            } else {
              aValue = (ra?.label || (a as any).role_code || '');
              bValue = (rb?.label || (b as any).role_code || '');
            }
          }
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'presences':
          aValue = a.presences || 0;
          bValue = b.presences || 0;
          break;
        case 'tardiness':
          aValue = a.tardiness || 0;
          bValue = b.tardiness || 0;
          break;
        case 'attendanceRate':
          aValue = a.attendanceRate || 0;
          bValue = b.attendanceRate || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.last_name;
          bValue = b.last_name;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [players, searchTerm, statusFilter, roleFilter, sortField, sortDirection, rolesByCode]);

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayer.mutateAsync(playerId);
    } catch (error) {
      console.error('❌ Error deleting player:', error);
    }
  };

  // Handler per bulk import success
  const handleBulkImportSuccess = (result: ImportResult) => {
    setBulkImportOpen(false);
    toast(`Import completato: ${result.totalSuccessful} giocatori importati`);
    // I dati verranno aggiornati automaticamente tramite React Query
  };

  // Group players by role
  const groupPlayersByRole = (players: Player[]) => {
    // Tactical progression: Goalkeeper FIRST → Defense → Midfield → Attack  
    const roleOrder = ['POR', 'P', 'GK', 'DC', 'DD', 'DS', 'MC', 'MD', 'MS', 'CC', 'CD', 'CS', 'TQ', 'AD', 'AS', 'AT', 'PC'];
    const groups: { [key: string]: Player[] } = {};
    
    // Initialize groups
    roles?.forEach(role => {
      groups[role.code] = [];
    });
    
    // Group players
    players.forEach(player => {
      const roleCode = (player as any).role_code || 'SENZA_RUOLO';
      if (!groups[roleCode]) {
        groups[roleCode] = [];
      }
      groups[roleCode].push(player);
    });
    
    // Sort groups by role order and return non-empty groups
    return roleOrder
      .filter(roleCode => groups[roleCode] && groups[roleCode].length > 0)
      .map(roleCode => ({
        roleCode,
        role: rolesByCode[roleCode],
        players: groups[roleCode]
      }))
      .concat(
        // Add any remaining roles not in the predefined order
        Object.keys(groups)
          .filter(roleCode => !roleOrder.includes(roleCode) && groups[roleCode].length > 0)
          .map(roleCode => ({
            roleCode,
            role: rolesByCode[roleCode],
            players: groups[roleCode]
          }))
      );
  };

  const groupedPlayers = useMemo(() => {
    return groupPlayersByRole(filteredAndSortedPlayers);
  }, [filteredAndSortedPlayers, roles, rolesByCode, groupPlayersByRole]);

  // Helpers for the new card
  const computeAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const getStatusPill = (status?: Player['status']) => {
    const label = status === 'active' ? 'Attivo'
      : status === 'inactive' ? 'Inattivo'
      : status === 'injured' ? 'Infortunato'
      : status === 'suspended' ? 'Squalificato'
      : '—';
    const cls = status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'injured' ? 'bg-rose-50 text-rose-700 border-rose-200'
      : status === 'suspended' ? 'bg-amber-50 text-amber-700 border-amber-200'
      : status === 'inactive' ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
      : 'bg-neutral-50 text-neutral-600 border-neutral-200';
    return { label, cls };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header compatto */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-base sm:text-lg font-semibold">Rosa Squadra · <span className="tabular-nums">{players.length}</span> giocatori</div>
        <div className="flex items-center gap-2">
          {/* Add Player Buttons - Desktop only */}
          <div className="hidden sm:flex gap-2">
            <PlayerForm>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Giocatore
              </Button>
            </PlayerForm>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setBulkImportOpen(true)}
              disabled={!teamId}
            >
              <Users className="h-4 w-4 mr-2" />
              Import Bulk
            </Button>
          </div>
          <Dialog open={captainDialogOpen} onOpenChange={setCaptainDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 rounded-full text-xs">Seleziona Capitano</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Seleziona Capitano</DialogTitle>
              </DialogHeader>
              <div className="p-2 space-y-3">
                <Select value={selectedCaptain} onValueChange={setSelectedCaptain}>
                  <SelectTrigger><SelectValue placeholder="Nessuno" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuno</SelectItem>
                    {players.filter(p => p.status === 'active').map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.jersey_number ? ` (#${p.jersey_number})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={()=>setFiltersOpen(true)} className="h-9 w-9 rounded-full"><SlidersHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Toolbar sticky (mobile-first) */}
      <div className="sticky top-2 z-10 bg-white/80 backdrop-blur rounded-full border px-2 py-1.5 shadow-sm mb-8">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Cerca" className="pl-8 rounded-full h-8" />
          </div>
          <ToggleGroup type="single" value={viewMode} onValueChange={(v:any)=> v && setViewMode(v)}>
            <ToggleGroupItem value="card" className="rounded-full px-2 h-8 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="table" className="rounded-full px-2 h-8 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"><Rows className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Active filters chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
          {activeFilterChips.map(ch => (
            <span key={ch.key} className="inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5 bg-white">
              {ch.label}
              <button onClick={ch.onClear} className="text-neutral-500"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Bottom sheet filters */}
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filtri</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Ruolo</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue placeholder="Tutti i ruoli" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i ruoli</SelectItem>
                  {presentRoles.map(r => (<SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Stato</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Tutti gli stati" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="inactive">Inattivo</SelectItem>
                  <SelectItem value="injured">Infortunato</SelectItem>
                  <SelectItem value="suspended">Squalificato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
          </div>
        </DrawerContent>
      </Drawer>

      {/* FAB Mobile Actions */}
      <div className="fixed bottom-4 right-4 sm:hidden z-20 flex flex-col gap-3">
        {/* FAB Import Bulk */}
        <Button 
          variant="outline" 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg bg-white border-2"
          onClick={() => setBulkImportOpen(true)}
          disabled={!teamId}
        >
          <Users className="h-5 w-5" />
        </Button>
        
        {/* FAB Aggiungi Giocatore */}
        <PlayerForm>
          <Button variant="default" size="icon" className="h-12 w-12 rounded-full shadow-lg">
            <Plus className="h-5 w-5" />
          </Button>
        </PlayerForm>
      </div>

      {showAdvancedFilters && (
        <Card className="mb-4"><CardContent className="p-4">{/* keep existing advanced filters UI */}
          <div className="space-y-4">
            {/* Stato, ordina, direzione, periodo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Ordina per:</label>
                <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleziona campo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome/Cognome</SelectItem>
                    <SelectItem value="jersey_number">Numero di maglia</SelectItem>
                    <SelectItem value="role_code">Ruolo</SelectItem>
                    <SelectItem value="phone">Telefono</SelectItem>
                    <SelectItem value="presences">Presenze allenamenti</SelectItem>
                    <SelectItem value="tardiness">Ritardi allenamenti</SelectItem>
                    <SelectItem value="attendanceRate">Percentuale presenze</SelectItem>
                    <SelectItem value="status">Stato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Direzione:</label>
                <Select value={sortDirection} onValueChange={(value: SortDirection) => setSortDirection(value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Ordine" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Periodo analisi presenze:</label>
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} placeholder="Seleziona periodo" />
            </div>
          </div>
        </CardContent></Card>
      )}

      {/* Vista Card */}
      {viewMode === 'card' && (
        <div className="">
                      {isLoading ? (
            <div className="grid grid-cols-1 min-[1000px]:grid-cols-2 min-[1440px]:grid-cols-3 min-[1800px]:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_,i)=> (
                <div key={i} className="rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {groupedPlayers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-lg mb-2">Nessun giocatore trovato</div>
                  <div className="text-sm">
                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                      ? 'Prova a modificare i filtri di ricerca.' 
                      : 'Inizia aggiungendo il primo giocatore alla rosa!'}
                  </div>
                </div>
              ) : (
                groupedPlayers.map((group) => (
                <Card key={group.roleCode} className="mb-6">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg leading-none mb-0 mt-0">
                          {group.role?.label || group.roleCode}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs leading-none h-fit py-1">
                          {group.players.length} {group.players.length === 1 ? 'giocatore' : 'giocatori'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {group.role?.abbreviation}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Players Grid for this role */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {group.players.map((p)=> {
                  const role = rolesByCode[(p as any).role_code || ''];
                  const imageSrc = p.avatar_url || defaultAvatarImageUrl || '';
                  const age = computeAge(p.birth_date);
                  const pres = p.matchPresences ?? 0; // keep zeros visible
                  const numero = p.jersey_number ?? null;
                  const ruoloBreve = role?.abbreviation || (p as any).role_code || '—';
                  const { label: statoLabel, cls: statoCls } = getStatusPill(p.status);
                  return (
                    <div
                      key={p.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => (window.location.href = `/player/${p.id}?ref=/squad`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (window.location.href = `/player/${p.id}?ref=/squad`) }}
                      className={`relative rounded-lg border border-border/40 shadow-sm bg-white hover:shadow-md transition hover:-translate-y-0.5 overflow-visible bg-gradient-to-r ${sectorHeroBgClass[sectorFromRoleCode((p as any).role_code)]}`}
                    >
                      <div className="relative p-4 md:p-2">
                        {/* Edit button in top-right corner */}
                        <div className="absolute top-2 right-2 z-10">
                          <EditPlayerForm player={p}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/80 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </EditPlayerForm>
                        </div>
                        
                        {/* Photo: sporge solo in alto, non a sinistra. Aumentata di un ulteriore 1.5x */}
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
                            <PlayerAvatar entityId={`player:${p.id}`} firstName={p.first_name} lastName={p.last_name} avatarUrl={p.avatar_url} size="lg" />
                          </div>
                        )}

                        {/* Riga 1: solo titolo e sottotitolo accanto all'immagine */}
                        <div className="pl-[109.6px] md:pl-[146.4px] min-h-[144px] md:min-h-[180px]">
                          <div className="space-y-2 pr-2">
                            <div className="font-semibold text-lg md:text-xl leading-tight">
                              <span className="block sm:hidden">
                                {p.first_name}<br />
                                {p.last_name}
                              </span>
                              <span className="hidden sm:block truncate">
                                {p.first_name} {p.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-xs md:text-sm text-muted-foreground truncate" title={role?.label || ''}>{role?.label || '—'}</div>
                              {p.is_captain && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">(C)</Badge>
                              )}
                            </div>
                            <NeonPillProgress value={squadScoreByPlayer[p.id]} />
                          </div>
                        </div>

                        {/* Riga 2: 4 label che occupano tutta la larghezza */}
                        <div className="grid grid-cols-4 gap-2 w-full ml-[5px] mt-[10px] mr-[10px]">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">PARTITE</div>
                            <div className={`mt-1 text-xs tabular-nums ${pres === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>{pres}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">ALLEN.</div>
                            <div className={`mt-1 text-xs tabular-nums ${(p.presences ?? 0) === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>{p.presences ?? 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">ETÀ</div>
                            <div className="mt-1 text-xs tabular-nums">{age ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">N.</div>
                            <div className="mt-1 text-xs tabular-nums">{numero ?? '—'}</div>
                          </div>
                        </div>

                        {/* Riga 3: divider e footer - stato a sinistra, link a destra */}
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <Badge variant="outline" className={`text-xs ${statoCls}`}>{statoLabel}</Badge>
                          <a
                            href={`/player/${p.id}?ref=/squad`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            <Eye className="h-4 w-4" />
                            maggiori dettagli
                          </a>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                    </div>
                  </CardContent>
                </Card>
              )))}

            </>
          )}
        </div>
      )}

      {/* Vista Tabella */}
      {viewMode === 'table' && (
        <Card><CardContent className="p-4 sm:p-6">
 
          {isLoading ? (
            <div className="text-center py-8">Caricamento giocatori...</div>
          ) : filteredAndSortedPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 'Nessun giocatore trovato con i filtri selezionati.' : 'Nessun giocatore presente. Aggiungi il primo giocatore!'}
            </div>
          ) : (
            <>
              {/* Desktop Table (1100px and above) */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Nome/Cognome</TableHead>
                      <TableHead className="font-semibold">Numero</TableHead>
                      <TableHead className="font-semibold">Ruolo</TableHead>
                      <TableHead className="font-semibold">Presenze Partite</TableHead>
                      <TableHead className="font-semibold">Presenze Allenamenti</TableHead>
                      <TableHead className="font-semibold">Ritardi Allenamenti</TableHead>
                      <TableHead className="font-semibold">Ritardi Partite</TableHead>
                      <TableHead className="font-semibold">Stato</TableHead>
                      <TableHead className="text-right font-semibold">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <a href={`/player/${player.id}?ref=/squad`} className="hover:underline">{player.first_name} {player.last_name}</a>
                                {player.is_captain && (
                                  <Badge variant="default" className="text-xs bg-yellow-600 hover:bg-yellow-700">(C)</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {player.jersey_number && (
                            <Badge variant="outline">#{player.jersey_number}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRolePlayerId === player.id ? (
                            <Select
                              value={(player as any).role_code || ''}
                              onValueChange={async (value) => {
                                await onChangeRole(player.id, value);
                              }}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setEditingRolePlayerId(null);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-[140px]">
                                <SelectValue placeholder="Seleziona ruolo" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map(r => (
                                  <SelectItem key={r.code} value={r.code}>
                                    {r.label} ({r.abbreviation})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded group"
                              onClick={() => setEditingRolePlayerId(player.id)}
                            >
                              <span>{rolesByCode[(player as any).role_code || '']?.abbreviation || (player as any).role_code || '-'}</span>
                              <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="tabular-nums">
                              {(player.matchPresences || 0)}/{player.matchEndedTotal || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {player.trainingPresences || 0}/{player.trainingTotal || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={player.trainingTardiness > 0 ? "destructive" : "outline"}>
                            {player.trainingTardiness || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={player.matchTardiness > 0 ? "destructive" : "outline"}>
                            {player.matchTardiness || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              player.status === 'active' ? 'default' :
                              player.status === 'injured' ? 'destructive' :
                              player.status === 'suspended' ? 'secondary' : 'outline'
                            }
                          >
                            {player.status === 'active' ? 'Attivo' :
                             player.status === 'inactive' ? 'Inattivo' :
                             player.status === 'injured' ? 'Infortunato' :
                             player.status === 'suspended' ? 'Squalificato' : player.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <a href={`/player/${player.id}?ref=/squad`} className="text-sm text-primary hover:underline">Visualizza dettagli</a>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Elimina giocatore</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione rimuoverà definitivamente <strong>{player.first_name} {player.last_name}</strong> dalla rosa della squadra. Tutti i dati associati verranno eliminati.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePlayer(player.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* No mobile accordion in table view */}
            </>
          )}
        </CardContent></Card>
      )}

      {/* Modale per visualizzare l'immagine del giocatore */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {selectedPlayerImage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            <div className="flex justify-center">
              {selectedPlayerImage?.src ? (
                <img
                  src={selectedPlayerImage.src}
                  alt={selectedPlayerImage.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    // Se l'immagine non carica, mostra il fallback
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`max-w-full max-h-[60vh] w-64 h-64 rounded-lg shadow-lg flex items-center justify-center text-6xl font-bold text-white bg-gradient-to-br from-primary to-primary/80 ${
                  selectedPlayerImage?.src ? 'hidden' : 'flex'
                }`}
              >
                {selectedPlayerImage?.fallback}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Wizard */}
      <BulkImportWizard
        teamId={teamId}
        teamName={teamName}
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={handleBulkImportSuccess}
      />
      </div>
    </div>
  );
};

export default Squad;
