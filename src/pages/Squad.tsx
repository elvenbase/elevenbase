
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
import { Search, LayoutGrid, Rows, SlidersHorizontal, Plus, X, Eye } from 'lucide-react'
import { useAvatarBackgrounds } from '@/hooks/useAvatarBackgrounds'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useQueryClient } from '@tanstack/react-query'

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
  const [widthPct, setWidthPct] = React.useState(0)
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const v = Math.max(0, Math.min(100, Number.isFinite(value as number) ? (value as number) : 0))
          setWidthPct(v)
          obs.disconnect()
        }
      })
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])

  const pctText = Number.isFinite(value as number) ? `${Math.round(value as number)}%` : '—'
  const ariaProps = indeterminate
    ? { role: 'progressbar', 'aria-label': ariaLabel, 'aria-valuemin': 0, 'aria-valuemax': 100 } as any
    : { role: 'progressbar', 'aria-label': ariaLabel, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.max(0, Math.min(100, value || 0)) } as any

  return (
    <div className="space-y-1.5">
      <style>{`
        @keyframes stripes-move { 0% { background-position: 0 0; } 100% { background-position: 24px 0; } }
        @keyframes indet-move { 0% { transform: translateX(-60%); } 100% { transform: translateX(160%); } }
        @media (max-width: 640px) {
          .stripe-size { background-size: 16px 16px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-stripes { animation: none !important; }
          .animate-indet { animation: none !important; }
        }
      `}</style>
      <div className="text-[10px] text-muted-foreground">Squad Score</div>
      <div
        ref={trackRef}
        className="relative w-full h-7 sm:h-10 rounded-full p-[2px]"
        style={{
          border: '2px solid #2D77FF',
          boxShadow: '0 0 16px rgba(45,119,255,0.20)',
          background: '#081026',
        }}
        {...ariaProps}
      >
        {/* Determinate fill */}
        {!indeterminate && (
          <div className="relative h-full rounded-full overflow-hidden transition-[width] duration-300 ease-out" style={{ width: `${widthPct}%`, background: '#1E4ED8' }}>
            {/* Stripes overlay */}
            <div className="absolute inset-0 opacity-35 animate-stripes stripe-size" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #2D77FF 0, #2D77FF 12px, transparent 12px, transparent 24px)',
              animation: 'stripes-move 2.5s linear infinite'
            }} />
            {/* Center label */}
            {showLabel && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[12px] sm:text-sm font-semibold text-white tabular-nums" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{pctText}</div>
              </div>
            )}
          </div>
        )}
        {/* Indeterminate segment */}
        {indeterminate && (
          <div className="relative h-full rounded-full overflow-hidden" style={{ background: '#1E4ED8' }}>
            <div className="absolute inset-y-0 left-0 w-3/5 rounded-full animate-indet" style={{
              background: '#1E4ED8',
              animation: 'indet-move 2.5s linear infinite'
            }} />
            <div className="absolute inset-0 opacity-35 animate-stripes stripe-size" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #2D77FF 0, #2D77FF 12px, transparent 12px, transparent 24px)',
              animation: 'stripes-move 2.5s linear infinite'
            }} />
          </div>
        )}
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [selectedCaptain, setSelectedCaptain] = useState<string>('none');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card'|'table'>('card')
  const [openPlayerId, setOpenPlayerId] = useState<string|null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [captainDialogOpen, setCaptainDialogOpen] = useState(false)
  
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

  // Carica capitano attuale al mount e quando cambiano i players
  React.useEffect(() => {
    const currentCaptain = players.find(p => p.is_captain);
    if (currentCaptain) {
      setSelectedCaptain(currentCaptain.id);
    } else {
      setSelectedCaptain('none');
    }
  }, [players]);

  // Funzione per aggiornare il capitano
  const queryClient = useQueryClient()

  const updateCaptain = async (newCaptainId: string) => {
    try {
      // Rimuovi is_captain da tutti i giocatori
      await supabase
        .from('players')
        .update({ is_captain: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update tutti

      // Se selezionato un capitano (non "none"), impostalo
      if (newCaptainId && newCaptainId !== 'none') {
        const { error } = await supabase
          .from('players')
          .update({ is_captain: true })
          .eq('id', newCaptainId);

        if (error) throw error;
        
        const captain = players.find(p => p.id === newCaptainId);
        toast.success(`${captain?.first_name} ${captain?.last_name} è ora il capitano`);
        // Refresh immediato
        queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] })
        queryClient.invalidateQueries({ queryKey: ['players'] })
        setCaptainDialogOpen(false)
      } else {
        toast.success('Nessun capitano selezionato');
        queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] })
        queryClient.invalidateQueries({ queryKey: ['players'] })
        setCaptainDialogOpen(false)
      }
    } catch (error) {
      console.error('🔥 ERRORE DETTAGLIATO CAPITANO:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      toast.error(`Errore nell'aggiornamento del capitano: ${error?.message || error}`);
      // Revert UI state
      const currentCaptain = players.find(p => p.is_captain);
      setSelectedCaptain(currentCaptain?.id || 'none');
    }
  };

  // Salva quando cambia la selezione del capitano
  React.useEffect(() => {
    const currentCaptain = players.find(p => p.is_captain);
    const currentCaptainId = currentCaptain?.id || 'none';
    
    // Solo se è cambiato davvero e non è il caricamento iniziale
    if (selectedCaptain !== currentCaptainId && players.length > 0) {
      updateCaptain(selectedCaptain);
    }
  }, [selectedCaptain]);

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
    console.log('🗑️ Attempting to delete player with ID:', playerId);
    try {
      console.log('🔄 Calling deletePlayer.mutateAsync...');
      await deletePlayer.mutateAsync(playerId);
      console.log('✅ Player deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting player:', error);
    }
  };

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
    <div className="mx-auto w-full px-2 sm:px-4 lg:px-6 py-6">
      {/* Header compatto */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-base sm:text-lg font-semibold">Rosa Squadra · <span className="tabular-nums">{players.length}</span> giocatori</div>
        <div className="flex items-center gap-2">
          <Dialog open={captainDialogOpen} onOpenChange={setCaptainDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">(C)</Button>
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

      {/* FAB Aggiungi */}
      <div className="fixed bottom-4 right-4 sm:hidden z-20">
        <PlayerForm>
          <Button variant="default" size="icon" className="h-12 w-12 rounded-full shadow-lg"><Plus className="h-5 w-5" /></Button>
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
            <div className="grid grid-cols-1 min-[800px]:grid-cols-2 min-[1000px]:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
              <div className="grid grid-cols-1 min-[800px]:grid-cols-2 min-[1000px]:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredAndSortedPlayers.map((p)=> {
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
                      onClick={() => (window.location.href = `/player/${p.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (window.location.href = `/player/${p.id}`) }}
                      className={`relative rounded-lg border border-border/40 shadow-sm bg-white hover:shadow-md transition hover:-translate-y-0.5 overflow-visible bg-gradient-to-r ${sectorHeroBgClass[sectorFromRoleCode((p as any).role_code)]}`}
                    >
                      <div className="relative p-4 md:p-6">
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
                            <div className="font-semibold text-lg md:text-xl leading-tight truncate">{p.first_name} {p.last_name}</div>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-xs md:text-sm text-muted-foreground truncate" title={role?.label || ''}>{role?.label || '—'}</div>
                              {p.is_captain && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">(C)</Badge>
                              )}
                            </div>
                            <NeonPillProgress value={squadScoreByPlayer[p.id]} />
                          </div>
                        </div>

                        {/* Riga 2: 3 label a tutta larghezza con spazio ridotto */}
                        <div className="mt-0.5 grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">PARTITE</div>
                            <div className={`mt-1 text-xs tabular-nums ${pres === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>{pres}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">ETÀ</div>
                            <div className="mt-1 text-xs tabular-nums">{age ?? '—'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">NUMERO</div>
                            <div className="mt-1 text-xs tabular-nums">{numero ?? '—'}</div>
                          </div>
                        </div>

                        {/* Riga 3: divider e footer - stato a sinistra, link a destra */}
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <Badge variant="outline" className={`text-xs ${statoCls}`}>{statoLabel}</Badge>
                          <a
                            href={`/player/${p.id}`}
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
                                <a href={`/player/${player.id}`} className="hover:underline">{player.first_name} {player.last_name}</a>
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
                          <span>{rolesByCode[(player as any).role_code || '']?.abbreviation || (player as any).role_code || '-'}</span>
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
                            <a href={`/player/${player.id}`} className="text-sm text-primary hover:underline">Visualizza dettagli</a>

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
    </div>
  );
};

export default Squad;
