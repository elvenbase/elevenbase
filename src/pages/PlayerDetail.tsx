import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePlayerMatchStats } from '@/hooks/useSupabaseData'
import { usePlayerNoteEvents } from '@/hooks/useSupabaseData'
import { usePlayerById, useFormerTrialistData } from '@/hooks/useSupabaseData'
import { usePlayerAttendanceSummary } from '@/hooks/useSupabaseData'
import { useRoles } from '@/hooks/useRoles'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import EditPlayerForm from '@/components/forms/EditPlayerForm'
import { Upload, ArrowLeft, User, Gamepad2, Phone, Mail, Hash, CalendarDays, StickyNote, Trophy } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useUpdatePlayer } from '@/hooks/useSupabaseData'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// Match icons (same style as live match)
const GOAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" xml:space="preserve"><g transform="translate(1.4066 1.4066) scale(2.81 2.81)"><path d="M 78.362 27.04 c -4.492 -4.266 -10.521 -6.921 -17.174 -7.052 l 1.505 6.224 l 7.664 3.141 L 78.362 27.04 z" fill="#f1f1f1"/><polygon points="75.58,54.87 78.06,46.58 70.67,39.99 62.1,42.53 59.27,50.93 64.08,56.43 " fill="#f1f1f1"/><polygon points="60.46,41.99 55.38,35.17 44.57,37.42 42.75,43.9 49.91,52.19 57.62,50.41 " fill="#f1f1f1"/><path d="M 79.741 28.445 l -8.093 2.339 v 7.755 l 7.882 7.039 l 6.818 -0.513 C 86.2 38.676 83.734 32.862 79.741 28.445 z" fill="#f1f1f1"/><path d="M 59.413 20.014 c -7.895 0.384 -14.856 4.324 -19.306 10.261 l 4.146 5.443 l 10.843 -2.254 l 5.88 -6.986 L 59.413 20.014 z" fill="#f1f1f1"/><path d="M 59.624 70.531 v -0.077 l -0.989 -5.847 l -8.8 -2.62 l -5.467 3.501 c 4.221 3.477 9.557 5.645 15.404 5.848 l -0.136 -0.805 H 59.624 z" fill="#f1f1f1"/><path d="M 48.96 60.492 v -6.763 l -7.54 -8.723 l -6.433 0.662 c 0 7.34 3.083 13.956 8.019 18.637 L 48.96 60.492 z" fill="#f1f1f1"/><path d="M 64.493 58.119 l -4.178 6.035 l 1.215 7.183 c 7.034 -0.23 13.351 -3.282 17.853 -8.068 l -3.699 -6.667 L 64.493 58.119 z" fill="#f1f1f1"/><path d="M 59.746 20.905 c -0.031 0.031 -0.063 0.063 -0.095 0.094 l -0.238 -0.985 c -7.895 0.384 -14.856 4.324 -19.306 10.261 l 4.146 5.443 l 10.843 -2.254 l 5.88 -6.986 L 59.746 20.905 z" fill="#dbdbdb"/><path d="M 44.571 37.422 l -1.819 6.476 l 5.61 6.491 c -0.939 -4.701 -0.603 -9.355 1 -13.962 L 44.571 37.422 z" fill="#dbdbdb"/><path d="M 59.624 70.531 v -0.077 l -0.046 -0.271 c 0.015 0.016 0.031 0.033 0.046 0.049 v -0.018 c -2.163 -2.339 -4.051 -4.668 -5.617 -6.985 l -4.172 -1.242 l -5.467 3.501 c 4.221 3.477 9.557 5.645 15.404 5.848 l -0.136 -0.805 H 59.624 z" fill="#57595d"/><path d="M 59.651 20.999 c 0.339 -0.341 0.674 -0.682 1.028 -1.023 c -0.425 0 -0.847 0.012 -1.267 0.032 L 59.651 20.999 z" fill="#3f4042"/><path d="M 48.96 53.729 v 6.763 l -5.955 3.814 c 0.435 0.413 0.879 0.815 1.342 1.197 l 5.487 -3.514 l 4.172 1.242 c -2.919 -4.318 -4.798 -8.599 -5.645 -12.841 l -5.61 -6.491 l 1.819 -6.476 l 4.791 -0.996 c 0.223 -0.642 0.469 -1.283 0.742 -1.923 l -5.85 1.216 l -4.146 -5.443 c -1.663 2.281 -2.894 4.643 -3.735 7.079 c -0.061 0.195 -0.12 0.391 -0.177 0.587 c -0.087 0.346 -0.168 0.693 -0.241 1.044 c -0.082 0.403 -0.155 0.81 -0.218 1.219 c -0.062 0.504 -0.111 1.012 -0.147 1.524 c -0.009 0.15 -0.019 0.299 -0.026 0.449 c -0.017 0.386 -0.029 0.774 -0.029 1.164 l 6.433 -0.662 L 48.96 53.729 z" fill="#3f4042"/><path d="M 59.773 71.337 c 0.301 0.01 0.602 0.023 0.906 0.023 c -0.379 -0.393 -0.739 -0.785 -1.101 -1.176 L 59.773 71.337 z" fill="#3f4042"/><path d="M 3.085 90 c -0.578 0 -1.047 -0.468 -1.047 -1.047 c 0 -0.578 0.469 -1.047 1.047 -1.047 c 45.647 0 82.783 -19.248 82.783 -42.907 S 48.732 2.093 3.085 2.093 c -0.578 0 -1.047 -0.469 -1.047 -1.047 S 2.507 0 3.085 0 c 46.801 0 84.876 20.187 84.876 45 C 87.961 69.813 49.886 90 3.085 90 z" fill="#3f4042"/><path d="M 3.085 67.102 c -0.578 0 -1.047 -0.468 -1.047 -1.047 c 0 -0.578 0.469 -1.047 1.047 -1.047 c 49.518 0 82.783 -9.966 82.783 -19.276 c 0 -9.309 -33.265 -19.276 -82.783 -19.276 c -0.578 0 -1.047 -0.469 -1.047 -1.047 s 0.469 -1.047 1.047 -1.047 c 41.721 0 84.876 7.993 84.876 21.369 S 44.807 67.102 3.085 67.102 z" fill="#3f4042"/><path d="M 58.664 78.95 c -0.182 0 -0.366 -0.047 -0.533 -0.146 c -0.497 -0.295 -0.66 -0.937 -0.366 -1.435 c 13.368 -22.522 13.376 -44.29 0.025 -64.698 c -0.317 -0.483 -0.181 -1.132 0.303 -1.449 c 0.484 -0.317 1.132 -0.181 1.449 0.303 c 13.825 21.132 13.834 43.644 0.025 66.913 C 59.369 78.767 59.022 78.95 58.664 78.95 z" fill="#3f4042"/><path d="M 33.364 86.895 c -0.138 0 -0.278 -0.028 -0.413 -0.085 c -0.531 -0.229 -0.776 -0.845 -0.547 -1.376 c 10.926 -25.371 10.951 -52.636 0.076 -81.04 c -0.206 -0.54 0.063 -1.145 0.603 -1.352 c 0.539 -0.205 1.145 0.063 1.352 0.603 c 11.076 28.93 11.039 56.727 -0.109 82.616 C 34.155 86.658 33.769 86.895 33.364 86.895 z" fill="#3f4042"/></g></svg>`
const ASSIST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" xml:space="preserve"><g transform="translate(1.4222 1.4222) scale(2.84 2.84)"><path d="M 88.921 70.832 C 65.445 59.386 58.165 42.96 38.486 30.257 c -5.663 -1.416 -9.653 -3.337 -12.187 -5.698 c 0.227 6.706 3.271 12.965 12.5 18.241 C 26.364 45.648 13.326 44.637 0 41.788 c 0.093 6.46 7.473 13.831 23.934 17.461 c 6.257 1.226 11.196 4.319 15.59 7.203 c -9.956 -2.716 -18.233 -2.048 -24.581 2.504 c 5.985 1.199 10.985 2.307 15.625 5.281 C 44.104 83.366 77.657 96.693 88.921 70.832 z" fill="#f9a83d"/><path d="M 26.123 51.528 c 5.516 0.577 11.21 0.659 17.113 -1.46 c 13.689 -5.099 26.939 -1.726 26.939 -1.726 l 14.352 19.285 c -6.167 5.789 -12.444 11.259 -21.071 9.952 c -9.784 -1.461 -19.72 -10.749 -23.839 -16.805 c 2.642 0.591 5.479 0.638 8.547 0.036 C 38.611 58.33 30.77 55.374 26.123 51.528 z" fill="#f7d33e"/><path d="M 87.746 68.571 L 76.805 53.352 c -6.133 -8.978 -11.801 -19.723 -17.318 -31.04 c -0.482 -0.989 -1.602 -1.492 -2.661 -1.196 c -7.524 2.098 -14.305 0.244 -20.177 -6.444 c -0.149 -0.17 -0.281 -0.369 -0.378 -0.573 c -1.56 -3.252 -2.288 -6.15 -2.457 -8.808 c -0.084 -1.329 -1.243 -2.382 -2.558 -2.168 c -2.103 0.342 -4.615 2.115 -7.71 5.921 l -9.944 14.444 c -0.682 0.99 -0.479 2.339 0.463 3.085 l 3.124 2.473 l -1.329 2.685 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.562 -1.836 l 3.919 3.103 l -1.268 2.562 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.449 -1.755 l 18.221 14.427 c 2.415 1.743 4.814 3.364 7.204 4.91 l -0.743 2.633 c -0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.757 -1.832 c 1.303 0.779 2.601 1.526 3.897 2.248 l -0.574 2.032 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.529 -1.594 c 1.462 0.744 2.92 1.456 4.373 2.129 l -0.612 2.167 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.926 -2.008 c 0.005 -0.005 0.007 -0.011 0.012 -0.016 c 1.16 0.476 2.319 0.941 3.474 1.373 C 87.302 74.897 90.73 72.785 88.044 68.985 z" fill="#f73e42"/><path d="M 27.711 31.241 l -12.667 -9.863 c 0 0 8.458 -12.281 8.502 -12.335 C 29.767 15.644 32.139 22.88 27.711 31.241 z" fill="#e5393d"/><path d="M 88.044 68.985 c -1.012 -0.028 -2.211 -0.298 -3.516 -0.856 c -10.825 -4.046 -21.892 -10.031 -33.233 -18.215 L 16.19 22.119 c -0.414 -0.328 -0.676 -0.775 -0.792 -1.255 l -1.921 2.791 c -0.682 0.99 -0.479 2.339 0.463 3.085 l 3.124 2.473 l -1.329 2.685 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.562 -1.836 l 3.919 3.103 l -1.268 2.562 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.449 -1.755 l 18.221 14.427 c 2.415 1.743 4.814 3.364 7.204 4.91 l -0.743 2.633 c -0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.757 -1.832 c 1.303 0.779 2.601 1.526 3.897 2.248 l -0.574 2.032 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.529 -1.594 c 1.462 0.744 2.92 1.456 4.373 2.129 l -0.612 2.167 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.926 -2.008 c 0.005 -0.005 0.007 -0.011 0.012 -0.016 c 1.16 0.476 2.319 0.941 3.474 1.373 C 87.302 74.897 90.73 72.785 88.044 68.985 z" fill="#57595d"/></g></svg>`
const GoalIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: GOAL_SVG }} />
)
const AssistIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: ASSIST_SVG }} />
)

const PlayerDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data: player } = usePlayerById(id || '')
  const { data: stats = [] } = usePlayerMatchStats(id || '')
  const { data: noteEvents = [] } = usePlayerNoteEvents(id || '')
  const { data: formerTrialist } = useFormerTrialistData(player as any)
  const heroAvatarUrl = (player?.avatar_url || (formerTrialist as any)?.avatar_url || '') as string
  const { data: attendance } = usePlayerAttendanceSummary(id || '')
  const { data: roles = [] } = useRoles()
  const updatePlayer = useUpdatePlayer()
  const { toast } = useToast()

  if (!id) return null

  const totals = stats.reduce((acc:any, r:any) => {
    acc.matches += 1
    acc.started += r.started ? 1 : 0
    acc.minutes += r.minutes || 0
    acc.goals += r.goals || 0
    acc.assists += r.assists || 0
    acc.yellows += r.yellow_cards || 0
    acc.reds += r.red_cards || 0
    acc.fouls += r.fouls_committed || 0
    acc.saves += r.saves || 0
    // MVP: confronta con matches.mvp_player_id / mvp_trialist_id se presenti
    const m = r.matches as any
    const mvpPlayerId = m?.mvp_player_id
    const mvpTrialistId = m?.mvp_trialist_id
    if (mvpPlayerId === id || mvpTrialistId === id) acc.mvp = (acc.mvp || 0) + 1
    return acc
  }, { matches: 0, started: 0, minutes: 0, goals: 0, assists: 0, yellows: 0, reds: 0, fouls: 0, saves: 0, mvp: 0 })

  const roleMap = Object.fromEntries(roles.map((r:any)=>[r.code, r]))
  const roleLabel = player?.role_code ? `${roleMap[player.role_code]?.label || player.role_code} (${roleMap[player.role_code]?.abbreviation || player.role_code})` : '-'
  const shortName = player ? `${(player.first_name || '').trim().charAt(0).toUpperCase()}. ${(player.last_name || '').trim()}`.trim() : 'Giocatore'

  const sectorFromRoleCode = (code?: string): 'P'|'DIF'|'CEN'|'ATT'|'NA' => {
    if (!code) return 'NA'
    const c = code.toUpperCase()
    if (c === 'P') return 'P'
    if (['TD','DC','DCD','DCS','TS'].includes(c)) return 'DIF'
    if (['MC','MED','REG','MD','MS','ED','ES','QD','QS'].includes(c)) return 'CEN'
    if (['PU','ATT','AD','AS'].includes(c)) return 'ATT'
    return 'NA'
  }
  const sector = sectorFromRoleCode(player?.role_code)
  const sectorTheme = {
    P: { from: 'from-sky-500/20', to: 'to-sky-500/5', text: 'text-sky-700', chip: 'bg-sky-100 text-sky-800' },
    DIF: { from: 'from-emerald-500/20', to: 'to-emerald-500/5', text: 'text-emerald-700', chip: 'bg-emerald-100 text-emerald-800' },
    CEN: { from: 'from-amber-500/25', to: 'to-amber-500/5', text: 'text-amber-700', chip: 'bg-amber-100 text-amber-800' },
    ATT: { from: 'from-rose-500/25', to: 'to-rose-500/5', text: 'text-rose-700', chip: 'bg-rose-100 text-rose-800' },
    NA: { from: 'from-neutral-500/20', to: 'to-neutral-500/5', text: 'text-foreground', chip: 'bg-muted text-foreground' }
  }[sector]

  const parsePhone = (phone?: string) => {
    if (!phone) return { prefix: '+39 (Italia)', number: '' }
    const known = [
      { p: '+39', l: '+39 (Italia)' },{ p: '+1', l: '+1 (USA/Canada)' },{ p: '+44', l: '+44 (Regno Unito)' },{ p: '+33', l: '+33 (Francia)' },{ p: '+49', l: '+49 (Germania)' },{ p: '+34', l: '+34 (Spagna)' }
    ]
    const m = known.find(k => phone.startsWith(k.p))
    return m ? { prefix: m.l, number: phone.slice(m.p.length) } : { prefix: '+39 (Italia)', number: phone }
  }
  const phoneView = parsePhone(player?.phone || '')

  const handleAvatarUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file || !player) return
    if (!file.type.startsWith('image/')) { toast({ title: 'Formato non valido', variant: 'destructive' }); return }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'File troppo grande', description: 'Max 5MB', variant: 'destructive' }); return }
    const ext = file.name.split('.').pop()
    const fileName = `player-avatar-${player.id}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (upErr) { toast({ title: 'Errore di caricamento', variant: 'destructive' }); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    try {
      await updatePlayer.mutateAsync({ id: player.id, avatar_url: publicUrl })
      toast({ title: 'Avatar aggiornato' })
    } catch (e) {
      toast({ title: 'Errore salvataggio avatar', variant: 'destructive' })
    }
  }

  const per90 = (value: number, minutes: number) => minutes > 0 ? (value / minutes) * 90 : 0
  const gPer90 = per90(totals.goals, totals.minutes)
  const aPer90 = per90(totals.assists, totals.minutes)
  const sPer90 = per90(totals.saves, totals.minutes)

  const lastN = stats.slice(-10)
  const maxMin = Math.max(90, ...lastN.map((s:any) => s.minutes || 0))
  const maxGA = Math.max(1, ...lastN.map((s:any) => (s.goals || 0)))
  const maxAst = Math.max(1, ...lastN.map((s:any) => (s.assists || 0)))
  const presenceCount = stats.filter((r:any) => (r.minutes || 0) > 0).length
  const endedMatchesForPlayer = stats.length

  const Radial = ({ pct, label }: { pct: number; label: string }) => {
    const p = Math.max(0, Math.min(100, Math.round(pct)))
    const color = sector === 'P' ? '#38bdf8' : sector === 'DIF' ? '#34d399' : sector === 'CEN' ? '#f59e0b' : sector === 'ATT' ? '#f43f5e' : '#6b7280'
    const bg = '#e5e7eb'
    const angle = (p / 100) * 360
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-20 h-20 rounded-full" style={{ background: `conic-gradient(${color} ${angle}deg, ${bg} 0deg)` }}>
          <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center text-sm font-semibold">{p}%</div>
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="flex justify-start">
          <Link to="/squad" className="inline-flex items-center gap-1 text-xs sm:text-sm text-neutral-400 hover:text-neutral-600 transition-colors underline-offset-4 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Torna alla rosa
          </Link>
        </div>
        <div className={`relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r ${sectorTheme.from} ${sectorTheme.to} min-h-[140px] sm:min-h-[180px]`}>
          {heroAvatarUrl && (
            <img
              src={heroAvatarUrl}
              alt=""
              className="absolute left-[-5%] top-1/2 -translate-y-1/2 h-[98%] w-auto object-cover pointer-events-none"
            />
          )}
          <div className="relative z-10 p-4 sm:p-6 flex items-center justify-end gap-3">
            <div className="ml-auto min-w-0 text-right">
              <div className="text-xl sm:text-2xl font-extrabold leading-tight">{shortName}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 justify-end">
                <Badge variant="secondary">#{player?.jersey_number ?? '-'}</Badge>
                <Badge className={`${sectorTheme.chip} font-semibold`}>{roleLabel}</Badge>
                <Badge className="bg-yellow-100 border border-yellow-300 text-yellow-800 font-semibold inline-flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" /> MVP {totals.mvp || 0}
                </Badge>
              </div>
              <div className="mt-3 ml-auto w-full sm:w-auto">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 justify-end">
                  {[
                    { key: 'gol', label: 'Gol', value: (stats.length>0 ? totals.goals : undefined), svg: <GoalIcon className="h-4 w-4 text-sky-500" />, color: 'text-sky-700', tint: 'bg-sky-50 border-sky-200', iconColor: 'text-sky-500' },
                    { key: 'ast', label: 'Assist', value: (stats.length>0 ? totals.assists : undefined), svg: <AssistIcon className="h-4 w-4 text-cyan-500" />, color: 'text-cyan-700', tint: 'bg-cyan-50 border-cyan-200', iconColor: 'text-cyan-500' },
                    { key: 'gialli', label: 'Gialli', value: (stats.length>0 ? totals.yellows : undefined), icon: '', color: 'text-yellow-700', tint: 'bg-yellow-50 border-yellow-200', iconColor: 'text-yellow-500', card: 'yellow' },
                    { key: 'rossi', label: 'Rossi', value: (stats.length>0 ? totals.reds : undefined), icon: '', color: 'text-rose-700', tint: 'bg-rose-50 border-rose-200', iconColor: 'text-rose-500', card: 'red' },
                    { key: 'pres', label: 'Presenze', value: (stats.length>0 ? presenceCount : undefined), total: endedMatchesForPlayer, icon: '👟', color: 'text-neutral-700', tint: 'bg-neutral-50 border-neutral-200', iconColor: 'text-neutral-500', composite: true },
                  ].map((t) => {
                    const isZero = t.composite ? (t.value === 0) : (t.value === 0)
                    const isNA = t.composite ? (t.total === undefined || t.total === null) : (t.value === undefined)
                    const activeCls = isZero || isNA ? 'bg-transparent border-border/40 text-muted-foreground' : `${t.tint} ${t.color}`
                    return (
                      <div key={t.key} className={`rounded-lg border px-2 py-2 ${activeCls}`}>
                        <div className="flex items-center gap-2">
                          {/* icon */}
                          {t.card ? (
                            <span aria-hidden className={`inline-block w-4 h-5 rounded-sm ${t.card==='yellow'?'bg-yellow-400':'bg-red-500'}`} />
                          ) : t.svg ? (
                            <span aria-hidden className="text-base leading-none">{t.svg}</span>
                          ) : (
                            <span aria-hidden className={`${t.iconColor} text-base leading-none`}>{t.icon || '•'}</span>
                          )}
                          <div className="flex flex-col items-end -mt-0.5">
                            <span className="tabular-nums font-semibold text-sm sm:text-base">{isNA ? '—' : (t.composite ? `${t.value}/${t.total}` : t.value)}</span>
                            <span className="hidden sm:block text-[10px] text-muted-foreground">{t.label}</span>
                            <span className="sr-only">{t.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profilo" className="w-full">
          <TabsList className="sticky top-2 z-10 bg-transparent p-0">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-full border border-border/40 bg-white/70 backdrop-blur px-1 py-1 shadow-sm">
                <TabsTrigger value="profilo" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 py-1.5 text-sm">Profilo</TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 py-1.5 text-sm">Performance</TabsTrigger>
                <TabsTrigger value="presenze" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 py-1.5 text-sm">Presenze</TabsTrigger>
                <TabsTrigger value="partite" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 py-1.5 text-sm">Partite</TabsTrigger>
                {formerTrialist && (<TabsTrigger value="prova" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 py-1.5 text-sm">Prova</TabsTrigger>)}
              </div>
              {player && (
                <div className="ml-2">
                  <EditPlayerForm player={player as any} />
                </div>
              )}
            </div>
          </TabsList>

          <TabsContent value="profilo">
            <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] lg:grid-cols-[2fr_1fr] gap-4">
              {/* Card Anagrafica */}
              <Card className="border border-border/40 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="h-4 w-4"/></span>
                    Anagrafica
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* micro riga riassuntiva */}
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-white px-2 py-0.5">#{player?.jersey_number ?? '—'}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-white px-2 py-0.5">{roleLabel}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-white px-2 py-0.5">
                      <CalendarDays className="h-3.5 w-3.5" />{player?.birth_date ? new Date(player.birth_date).toLocaleDateString() : '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-white px-2 py-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />{player?.status || 'Attivo'}
                    </span>
                  </div>

                  {/* definition grid 2 colonne */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Col A */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Nome</div>
                        <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-neutral-500" />{player?.first_name || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Cognome</div>
                        <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-neutral-500" />{player?.last_name || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Data di nascita</div>
                        <div className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-neutral-500" />{player?.birth_date ? new Date(player.birth_date).toLocaleDateString() : '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Esperienza sportiva</div>
                        <div className="flex items-start gap-2 text-sm whitespace-pre-wrap min-h-[20px]"><StickyNote className="mt-0.5 h-4 w-4 text-neutral-500" />{player?.esperienza ? player.esperienza : '—'}</div>
                      </div>
                    </div>
                    {/* Col B */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Numero maglia</div>
                        <div className="flex items-center gap-2 text-sm"><Hash className="h-4 w-4 text-neutral-500" />{player?.jersey_number ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Ruolo</div>
                        <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-neutral-500" />{roleLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Stato</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{player?.status || 'Attivo'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase text-neutral-500">Note</div>
                        <div className="flex items-start gap-2 text-sm whitespace-pre-wrap min-h-[20px]"><StickyNote className="mt-0.5 h-4 w-4 text-neutral-500" />{player?.notes ? player.notes : '—'}</div>
                      </div>
                    </div>

                    {/* Contatti full width */}
                    <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-2">
                        <Phone className="h-4 w-4 text-neutral-500" />
                        <span className="text-[11px] uppercase text-neutral-500">Telefono</span>
                        <span className="ml-auto text-sm text-neutral-700">{phoneView.number ? `${phoneView.prefix} ${phoneView.number}` : 'Non fornito'}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-2">
                        <Mail className="h-4 w-4 text-neutral-500" />
                        <span className="text-[11px] uppercase text-neutral-500">Email</span>
                        <span className="ml-auto text-sm text-neutral-700">{player?.email || 'Non fornito'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Informazioni Gaming */}
              <Card className="border border-border/40 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary"><Gamepad2 className="h-4 w-4"/></span>
                    Informazioni Gaming <span className="ml-2 text-xs text-neutral-500">(Opzionale)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-3">
                    {(() => {
                      const ea = (player as any)?.ea_sport_id
                      const plat = (player as any)?.gaming_platform
                      const pid = (player as any)?.platform_id
                      const chip = (label: string, value?: string) => (
                        <div className="rounded-lg border border-border/40 bg-white px-3 py-2">
                          <div className="text-[11px] uppercase text-neutral-500">{label}</div>
                          <div className="text-sm text-neutral-800">{value && value.trim() ? value : 'Aggiungi'}</div>
                        </div>
                      )
                      return (
                        <>
                          {chip('EA Sports ID', ea)}
                          {chip('Piattaforma', plat)}
                          {chip('Platform ID', pid)}
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader><CardTitle>KPI</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[
                    { label: 'Partite', v: totals.matches },
                    { label: 'Titolare', v: totals.started },
                    { label: 'Minuti', v: totals.minutes },
                    { label: 'Gol', v: totals.goals },
                    { label: 'Assist', v: totals.assists },
                    { label: 'Gialli', v: totals.yellows },
                    { label: 'Rossi', v: totals.reds },
                    { label: 'Parate', v: totals.saves },
                  ].map((k)=> (
                    <div key={k.label} className="rounded-lg border border-border/30 bg-background/60 p-3">
                      <div className="text-muted-foreground text-xs">{k.label}</div>
                      <div className="text-lg sm:text-xl font-semibold tabular-nums">{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">G/90: {gPer90.toFixed(2)}</Badge>
                  <Badge variant="secondary">A/90: {aPer90.toFixed(2)}</Badge>
                  {sector==='P' && (<Badge variant="secondary">Parate/90: {sPer90.toFixed(2)}</Badge>)}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader><CardTitle>Trend ultime 10</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Minuti</div>
                    <div className="flex items-end gap-1 h-24">
                      {lastN.map((s:any, i:number)=> (
                        <div key={i} className="bg-neutral-500/70 rounded-t" style={{ height: `${Math.max(6, (Math.min(maxMin, s.minutes || 0)/maxMin)*100)}%`, width: '8px' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Gol</div>
                    <div className="flex items-end gap-1 h-24">
                      {lastN.map((s:any, i:number)=> (
                        <div key={i} className="bg-red-500/80 rounded-t" style={{ height: `${Math.max(6, ((s.goals || 0)/maxGA)*100)}%`, width: '8px' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Assist</div>
                    <div className="flex items-end gap-1 h-24">
                      {lastN.map((s:any, i:number)=> (
                        <div key={i} className="bg-amber-500/80 rounded-t" style={{ height: `${Math.max(6, ((s.assists || 0)/maxAst)*100)}%`, width: '8px' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presenze">
            <Card>
              <CardHeader><CardTitle>Presenze e Ritardi</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Radial pct={attendance?.totals?.attendanceRate ?? 0} label="Totale" />
                  <Radial pct={(()=>{ const p = attendance?.training?.present ?? 0; const t = (attendance?.training?.tardy ?? 0); const tot = p + t; return tot>0 ? (p/tot)*100 : (attendance?.totals?.attendanceRate ?? 0) })()} label="Allenamenti" />
                  <Radial pct={(()=>{ const p = attendance?.match?.present ?? 0; const t = (attendance?.match?.tardy ?? 0); const tot = p + t; return tot>0 ? (p/tot)*100 : (attendance?.totals?.attendanceRate ?? 0) })()} label="Partite" />
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Allenamenti</div>
                    <div className="font-medium">Presenze: {attendance?.training.present ?? 0}</div>
                    <div className="font-medium">Ritardi: {attendance?.training.tardy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Partite</div>
                    <div className="font-medium">Presenze: {attendance?.match.present ?? 0}</div>
                    <div className="font-medium">Ritardi: {attendance?.match.tardy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Totale</div>
                    <div className="font-medium">Presenze: {attendance?.totals.present ?? 0}</div>
                    <div className="font-medium">Ritardi: {attendance?.totals.tardy ?? 0}</div>
                    <div className="font-medium">Tasso presenza: {attendance?.totals.attendanceRate ?? 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {formerTrialist && (
            <TabsContent value="prova">
              <Card>
                <CardHeader><CardTitle>Valutazioni dal Periodo di Prova</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                    <div><div className="text-muted-foreground">Periodo prova</div><div className="font-medium">{formerTrialist?.created_at ? new Date(formerTrialist.created_at).toLocaleDateString() : '-'} → {formerTrialist?.updated_at ? new Date(formerTrialist.updated_at).toLocaleDateString() : '-'}</div></div>
                    <div><div className="text-muted-foreground">Ruolo</div><div className="font-medium">{formerTrialist?.role_code || '-'}</div></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-2">Data</th>
                          <th className="py-2 pr-2">Tecnica</th>
                          <th className="py-2 pr-2">Fisica</th>
                          <th className="py-2 pr-2">Tattica</th>
                          <th className="py-2 pr-2">Atteggiamento</th>
                          <th className="py-2 pr-2">Media</th>
                          <th className="py-2 pr-2">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formerTrialist?.trial_evaluations || []).map((ev:any)=> (
                          <tr key={ev.id} className="border-t">
                            <td className="py-2 pr-2 whitespace-nowrap">{ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleDateString() : '-'}</td>
                            <td className="py-2 pr-2">{ev.technical_score ?? '-'}</td>
                            <td className="py-2 pr-2">{ev.physical_score ?? '-'}</td>
                            <td className="py-2 pr-2">{ev.tactical_score ?? '-'}</td>
                            <td className="py-2 pr-2">{ev.attitude_score ?? '-'}</td>
                            <td className="py-2 pr-2">{ev.overall_rating ? Number(ev.overall_rating).toFixed(1) : '-'}</td>
                            <td className="py-2 pr-2 max-w-[320px] truncate" title={ev.notes || ''}>{ev.notes || '-'}</td>
                          </tr>
                        ))}
                        {(formerTrialist?.trial_evaluations || []).length === 0 && (
                          <tr><td className="py-4 text-muted-foreground" colSpan={7}>Nessuna valutazione dal periodo di prova</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="partite">
            <Card>
              <CardHeader><CardTitle>Storico partite</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-2">Data</th>
                        <th className="py-2 pr-2">Avversario</th>
                        <th className="py-2 pr-2">Risultato</th>
                        <th className="py-2 pr-2">Titolare</th>
                        <th className="py-2 pr-2">Min</th>
                        <th className="py-2 pr-2">Gol</th>
                        <th className="py-2 pr-2">Ast</th>
                        <th className="py-2 pr-2">G</th>
                        <th className="py-2 pr-2">R</th>
                        <th className="py-2 pr-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((r:any)=>{
                        const m = r.matches
                        const date = m?.match_date ? new Date(m.match_date).toLocaleDateString() : ''
                        const opp = m?.opponents?.name || m?.opponent_name || '-'
                        const res = `${m?.our_score ?? '-'} - ${m?.opponent_score ?? '-'}`
                        const notesForMatch = (noteEvents as any[]).filter(ev => ev.match_id === r.match_id && ev.comment)
                        const noteSummary = notesForMatch.length > 0 ? (notesForMatch[0].comment as string) : ''
                        const noteFull = notesForMatch.map(ev => `${ev.minute ? ev.minute + "' " : ''}${ev.comment}`).join('\n')
                        return (
                          <tr key={r.id} className="border-t">
                            <td className="py-2 pr-2 whitespace-nowrap">{date}</td>
                            <td className="py-2 pr-2 whitespace-nowrap">{opp}</td>
                            <td className="py-2 pr-2">{res}</td>
                            <td className="py-2 pr-2">{r.started ? 'Sì' : 'No'}</td>
                            <td className="py-2 pr-2">{r.minutes}</td>
                            <td className="py-2 pr-2">{r.goals}</td>
                            <td className="py-2 pr-2">{r.assists}</td>
                            <td className="py-2 pr-2">{r.yellow_cards}</td>
                            <td className="py-2 pr-2">{r.red_cards}</td>
                            <td className="py-2 pr-2 max-w-[320px] truncate" title={noteFull}>{noteSummary}</td>
                          </tr>
                        )
                      })}
                      {stats.length === 0 && (
                        <tr><td className="py-6 text-muted-foreground" colSpan={10}>Nessuna partita registrata.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default PlayerDetail