import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Target, ArrowLeft, Play, Pause, Clock3, Plus, Shield, Redo2, StickyNote, Repeat, Trash2 } from 'lucide-react'
import { useMatch, useMatchEvents, useMatchAttendance, useMatchTrialistInvites, usePlayers } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateMatch } from '@/hooks/useSupabaseData'
import { useQueryClient } from '@tanstack/react-query'
import { useCustomFormations } from '@/hooks/useCustomFormations'
import { normalizeRoleCodeFrom } from '@/utils/roleNormalization'

const computeScore = (events: any[]) => {
  let us = 0, opp = 0
  for (const e of events) {
    if (e.event_type === 'goal') { e.team === 'us' ? us++ : opp++ }
    if (e.event_type === 'own_goal') { e.team === 'us' ? opp++ : us++ }
    if (e.event_type === 'pen_scored') { e.team === 'us' ? us++ : opp++ }
  }
  return { us, opp }
}

const MatchLive = () => {
  const { id } = useParams<{ id: string }>()
  const { data: match } = useMatch(id || '')
  const { data: events = [] } = useMatchEvents(id || '')
  const { data: attendance = [] } = useMatchAttendance(id || '')
  const { data: trialistInvites = [] } = useMatchTrialistInvites(id || '')
  const { data: players = [] } = usePlayers()
  const { lineup, loadLineup } = useMatchLineupManager(id || '')
  useEffect(() => { if (id) loadLineup() }, [id])
  const updateMatch = useUpdateMatch()
  const queryClient = useQueryClient()
  const { formations: customFormations } = useCustomFormations()

  // Static formations (subset) for role mapping
  const staticFormations: any = {
    '4-4-2': { positions: [
      { id: 'gk', roleShort: 'P', role: 'Portiere' },
      { id: 'rb', roleShort: 'TD', role: 'Terzino Destro' },
      { id: 'cb1', roleShort: 'DC', role: 'Difensore Centrale' },
      { id: 'cb2', roleShort: 'DC', role: 'Difensore Centrale' },
      { id: 'lb', roleShort: 'TS', role: 'Terzino Sinistro' },
      { id: 'rm', roleShort: 'ED', role: 'Esterno Destro' },
      { id: 'cm1', roleShort: 'MC', role: 'Centrocampista' },
      { id: 'cm2', roleShort: 'MC', role: 'Centrocampista' },
      { id: 'lm', roleShort: 'ES', role: 'Esterno Sinistro' },
      { id: 'st1', roleShort: 'ATT', role: 'Attaccante' },
      { id: 'st2', roleShort: 'ATT', role: 'Attaccante' }
    ] },
    '4-3-3': { positions: [
      { id: 'gk', roleShort: 'P', role: 'Portiere' },
      { id: 'rb', roleShort: 'TD', role: 'Terzino Destro' },
      { id: 'cb1', roleShort: 'DC', role: 'Difensore Centrale' },
      { id: 'cb2', roleShort: 'DC', role: 'Difensore Centrale' },
      { id: 'lb', roleShort: 'TS', role: 'Terzino Sinistro' },
      { id: 'cdm', roleShort: 'MED', role: 'Mediano' },
      { id: 'cm1', roleShort: 'MD', role: 'Mezzala Dx' },
      { id: 'cm2', roleShort: 'MS', role: 'Mezzala Sx' },
      { id: 'rw', roleShort: 'AD', role: 'Ala Destra' },
      { id: 'st', roleShort: 'PU', role: 'Punta' },
      { id: 'lw', roleShort: 'AS', role: 'Ala Sinistra' }
    ] },
    '3-5-2': { positions: [
      { id: 'gk', roleShort: 'P', role: 'Portiere' },
      { id: 'cb1', roleShort: 'DCD', role: 'Centrale Dx' },
      { id: 'cb2', roleShort: 'DC', role: 'Centrale' },
      { id: 'cb3', roleShort: 'DCS', role: 'Centrale Sx' },
      { id: 'rwb', roleShort: 'QD', role: 'Quinto Dx' },
      { id: 'cm1', roleShort: 'MC', role: 'Centrocampista' },
      { id: 'cm2', roleShort: 'REG', role: 'Regista' },
      { id: 'cm3', roleShort: 'MC', role: 'Centrocampista' },
      { id: 'lwb', roleShort: 'QS', role: 'Quinto Sx' },
      { id: 'st1', roleShort: 'ATT', role: 'Attaccante' },
      { id: 'st2', roleShort: 'ATT', role: 'Attaccante' }
    ] }
  }

  // Bench (convocati) from DB
  const [bench, setBench] = useState<any[]>([])
  const loadBench = async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('match_bench')
      .select(`id, match_id, player_id, trialist_id,
        players:player_id(id, first_name, last_name, avatar_url),
        trialists:trialist_id(id, first_name, last_name, avatar_url)
      `)
      .eq('match_id', id)
    if (!error) setBench(data || [])
  }
  useEffect(() => { loadBench() }, [id])

  const score = useMemo(() => computeScore(events), [events])
  const presentIds = useMemo(() => new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id)), [attendance])
  const titolariIds = useMemo(() => new Set(Object.values(lineup?.players_data?.positions || {})), [lineup])
  const trialistsPresent = useMemo(() => (trialistInvites as any[]).filter(t => t.status === 'present').map(t => ({ id: t.trialist_id, first_name: t.trialists?.first_name || 'Trialist', last_name: t.trialists?.last_name || '', isTrialist: true })), [trialistInvites])
  const titolari = useMemo(() => {
    const roster = players.filter((p: any) => titolariIds.has(p.id))
    const tr = trialistsPresent.filter((t: any) => titolariIds.has(t.id))
    return [...roster, ...tr]
  }, [players, titolariIds, trialistsPresent])
  const convocati = useMemo(() => {
    // Convocati = lista panchina (match_bench)
    return (bench || []).map((b: any) => {
      const p = b.players || b.trialists
      if (p) return { id: p.id, first_name: p.first_name, last_name: p.last_name, isTrialist: !!b.trialist_id }
      // Fallback se join missing
      return { id: (b.player_id || b.trialist_id), first_name: 'N/A', last_name: '', isTrialist: !!b.trialist_id }
    })
  }, [bench])
  const playersById = useMemo(() => Object.fromEntries(players.map((p: any) => [p.id, p])), [players])
  const trialistsById = useMemo(() => Object.fromEntries(trialistInvites.map((t: any) => [t.trialist_id, { id: t.trialist_id, first_name: t.trialists?.first_name || 'Trialist', last_name: t.trialists?.last_name || '', isTrialist: true }])), [trialistInvites])

  // Role mapping per posizione (id -> role label)
  const roleByPosId = useMemo(() => {
    const map: Record<string,string> = {}
    const lf = lineup?.formation
    // custom formations
    const cf = (customFormations || []).find(f => f.id === lf)
    if (cf) {
      cf.positions.forEach((p: any) => { if (p.id) map[p.id] = p.roleShort || p.role || p.name || '' })
    } else if (lf && staticFormations[lf]) {
      staticFormations[lf].positions.forEach((p: any) => { map[p.id] = p.roleShort || p.role })
    }
    return map
  }, [lineup?.formation, customFormations])
  const roleByPlayerId = useMemo(() => {
    const entries = Object.entries(lineup?.players_data?.positions || {})
    const m: Record<string,string> = {}
    entries.forEach(([posId, pid]) => { if (pid) m[pid as string] = roleByPosId[posId] || '' })
    return m
  }, [lineup, roleByPosId])

  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  // Initialize timer from match fields
  useEffect(() => {
    if (!match) return
    const offset = (match as any).clock_offset_seconds || 0
    const startedAt = (match as any).clock_started_at ? new Date((match as any).clock_started_at).getTime() : null
    if (startedAt) {
      setRunning(true)
      setSeconds(Math.floor((Date.now() - startedAt) / 1000) + offset)
    } else {
      setRunning(false)
      setSeconds(offset)
    }
  }, [match])
  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [running])

  const postEvent = async (evt: { event_type: string; team?: 'us'|'opponent'; player_id?: string|null; assister_id?: string|null; comment?: string|null; metadata?: any }) => {
    if (!id) return
    const minute = Math.max(0, Math.floor(seconds/60)) + 1
    const period = (match as any)?.live_state || 'not_started'
    const payload: any = {
      match_id: id,
      event_type: evt.event_type,
      team: evt.team || 'us',
      minute,
      period,
      comment: evt.comment || null,
      metadata: { ...(evt.metadata || {}), live: true }
    }
    if (evt.player_id) {
      if (isTrialistId(evt.player_id)) payload.trialist_id = evt.player_id
      else payload.player_id = evt.player_id
    }
    if (evt.assister_id) {
      if (!isTrialistId(evt.assister_id)) payload.assister_id = evt.assister_id
      else payload.metadata = { ...(payload.metadata || {}), assister_trialist_id: evt.assister_id }
    }
    const { error } = await supabase.from('match_events').insert(payload)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['match-events', id] })
    } else {
      console.error('Errore inserimento evento live:', error)
    }
  }
  const [lastEvents, setLastEvents] = useState<any[]>([])
  useEffect(() => {
    setLastEvents(events.slice(-6).reverse())
  }, [events])
  // Optimistic substitutions to reflect immediately before realtime/query refresh
  const [optimisticSubs, setOptimisticSubs] = useState<{ out_id: string; in_id: string }[]>([])
  useEffect(() => { if ((events || []).some((e: any) => e.event_type === 'substitution')) setOptimisticSubs([]) }, [events])

  // Realtime updates: refresh events on INSERT
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`match-events-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${id}` }, (_payload) => {
        queryClient.invalidateQueries({ queryKey: ['match-events', id] })
      })
      .subscribe()
    return () => {
      try { supabase.removeChannel(channel) } catch { /* ignore */ }
    }
  }, [id])

  // Player selection for events
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const flashRow = (pid: string) => {
    setFlashId(pid)
    setTimeout(() => setFlashId(null), 180)
  }
  const getDisplayName = (id: string) => {
    const p = playersById[id] || trialistsById[id]
    return p ? `${p.first_name} ${p.last_name}` : id
  }
  const isTrialistId = (id: string) => !!trialistsById[id]
  const eventStatsById = useMemo(() => {
    const stats: Record<string, { goals: number; assists: number; yellows: number; reds: number; fouls: number }> = {}
    ;(events || []).forEach((e: any) => {
      const pid = e.player_id || e.trialist_id
      if (!pid) return
      const s = stats[pid] || (stats[pid] = { goals: 0, assists: 0, yellows: 0, reds: 0, fouls: 0 })
      switch (e.event_type) {
        case 'goal': s.goals++; break
        case 'assist': s.assists++; break
        case 'yellow_card': s.yellows++; break
        case 'red_card': s.reds++; break
        case 'foul': s.fouls++; break
      }
    })
    return stats
  }, [events])
  const renderEventBadges = (pid: string) => {
    const s = eventStatsById[pid]
    if (!s) return null
    return (
      <div className="ml-auto flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
        {s.goals > 0 && (<span className="inline-flex items-center gap-0.5"><Plus className="h-3 w-3" />{s.goals}</span>)}
        {s.assists > 0 && (<span className="inline-flex items-center gap-0.5"><Redo2 className="h-3 w-3" />{s.assists}</span>)}
        {s.yellows > 0 && (<span className="inline-flex items-center gap-0.5 text-yellow-600"><Shield className="h-3 w-3" />{s.yellows}</span>)}
        {s.reds > 0 && (<span className="inline-flex items-center gap-0.5 text-red-600"><Shield className="h-3 w-3" />{s.reds}</span>)}
      </div>
    )
  }

  // Derive current on-field from lineup + substitutions
  const onFieldEntries = useMemo(() => {
    const baseEntries = Object.entries(lineup?.players_data?.positions || {}) as Array<[string, string]>
    const entries = [...baseEntries]
    ;(events || []).filter((e: any) => e.event_type === 'substitution').forEach((e: any) => {
      const outId = e.metadata?.out_id as string | undefined
      const inId = e.metadata?.in_id as string | undefined
      if (!outId || !inId) return
      const idx = entries.findIndex(([, pid]) => pid === outId)
      if (idx >= 0) entries[idx] = [entries[idx][0], inId]
    })
    optimisticSubs.forEach(({ out_id, in_id }) => {
      const idx = entries.findIndex(([, pid]) => pid === out_id)
      if (idx >= 0) entries[idx] = [entries[idx][0], in_id]
    })
    return entries
  }, [lineup, events])
  const onFieldIds = useMemo(() => new Set(onFieldEntries.map(([, pid]) => pid).filter(Boolean) as string[]), [onFieldEntries])
  const onFieldPlayers = useMemo(() => {
    return onFieldEntries.map(([, pid]) => {
      const p = playersById[pid] || trialistsById[pid]
      return p ? { ...p, id: pid } : { id: pid, first_name: 'N/A', last_name: '' }
    })
  }, [onFieldEntries, playersById, trialistsById])
  const roleByCurrentOnFieldPlayerId = useMemo(() => {
    const m: Record<string, string> = {}
    onFieldEntries.forEach(([posId, pid]) => { if (pid) m[pid] = roleByPosId[posId] || '' })
    return m
  }, [onFieldEntries, roleByPosId])

  // Order on-field list from GK -> DEF -> MID -> ATT
  const orderedOnFieldPlayers = useMemo(() => {
    const orderIndex = (code: string) => {
      const c = (code || '').toUpperCase()
      if (c === 'P') return 0
      if (['TD','DCD','DC','DCS','TS'].includes(c)) return 1
      if (['MED','REG','MC','MD','MS','QD','QS'].includes(c)) return 2
      if (['PU','AD','AS','ATT'].includes(c)) return 3
      return 4
    }
    return (onFieldPlayers as any[]).map((p: any) => {
      const rawRole = roleByCurrentOnFieldPlayerId[p.id] || ''
      const code = rawRole ? normalizeRoleCodeFrom({ roleShort: rawRole }) : 'ALTRI'
      return { ...p, _roleCode: code, _order: orderIndex(code) }
    }).sort((a, b) => a._order - b._order)
  }, [onFieldPlayers, roleByCurrentOnFieldPlayerId])

  // Substituted players (events-based), exclude those currently on field
  const substitutionEvents = useMemo(() => (events || []).filter((e: any) => e.event_type === 'substitution'), [events])
  const substitutedList = useMemo(() => {
    const lastOutMinuteById = new Map<string, number | undefined>()
    substitutionEvents.forEach((e: any) => {
      const outId = e.metadata?.out_id as string | undefined
      if (outId) lastOutMinuteById.set(outId, e.minute)
    })
    return Array.from(lastOutMinuteById.entries())
      .map(([id, minute]) => ({ id, minute }))
      .filter(it => !onFieldIds.has(it.id))
  }, [substitutionEvents, onFieldIds])

  // Substitution dialog
  const [subOpen, setSubOpen] = useState(false)
  const [subOutId, setSubOutId] = useState<string>('')
  const [subInId, setSubInId] = useState<string>('')
  const benchIds = useMemo(() => new Set(convocati.map((c: any) => c.id)), [convocati])
  const availableInIds = useMemo(() => Array.from(benchIds).filter((id: string) => !onFieldIds.has(id)), [benchIds, onFieldIds])
  const doSubstitution = async () => {
    if (!id || !subOutId || !subInId) return
    setOptimisticSubs(prev => [...prev, { out_id: subOutId, in_id: subInId }])
    const { error } = await supabase.from('match_events').insert({ match_id: id, event_type: 'substitution', metadata: { out_id: subOutId, in_id: subInId }, team: 'us' })
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['match-events', id] })
      try {
        // Ensure OUT player is added to bench
        if (isTrialistId(subOutId)) {
          const { data: existsOut } = await supabase
            .from('match_bench')
            .select('id').eq('match_id', id).eq('trialist_id', subOutId).limit(1).maybeSingle()
          if (!existsOut) {
            await supabase.from('match_bench').insert({ match_id: id, trialist_id: subOutId })
          }
        } else {
          const { data: existsOut } = await supabase
            .from('match_bench')
            .select('id').eq('match_id', id).eq('player_id', subOutId).limit(1).maybeSingle()
          if (!existsOut) {
            await supabase.from('match_bench').insert({ match_id: id, player_id: subOutId })
          }
        }
        // Ensure IN player is removed from bench
        if (isTrialistId(subInId)) {
          await supabase.from('match_bench').delete().eq('match_id', id).eq('trialist_id', subInId)
        } else {
          await supabase.from('match_bench').delete().eq('match_id', id).eq('player_id', subInId)
        }
      } catch (benchErr) {
        console.error('Errore aggiornamento panchina dopo sostituzione:', benchErr)
      }
      await loadBench()
    } else {
      console.error('Errore inserimento sostituzione:', error)
    }
    setSubOpen(false); setSubOutId(''); setSubInId('')
  }

  // Period controls
  const period = (match as any)?.live_state || 'not_started'
  const setPeriod = async (p: string) => {
    if (!id) return
    await updateMatch.mutateAsync({ id, updates: { live_state: p as any } })
  }
  const toggleTimer = async () => {
    if (!id) return
    const now = new Date()
    if (!running) {
      await updateMatch.mutateAsync({ id, updates: { clock_started_at: now.toISOString() } })
      setRunning(true)
    } else {
      const startedAt = (match as any).clock_started_at ? new Date((match as any).clock_started_at).getTime() : null
      const prevOffset = (match as any).clock_offset_seconds || 0
      const add = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
      const newOffset = prevOffset + add
      await updateMatch.mutateAsync({ id, updates: { clock_started_at: null as any, clock_offset_seconds: newOffset } })
      setRunning(false)
      setSeconds(newOffset)
    }
  }

  if (!id) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/match/${id}`}><ArrowLeft className="h-4 w-4 mr-2" />Torna al dettaglio</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{match?.opponent_name}</Badge>
            <Badge variant="default" className="text-base">{score.us} - {score.opp}</Badge>
            <div className="flex items-center gap-1 px-2 py-1 rounded border">
              <Clock3 className="h-4 w-4" />
              <span className="tabular-nums">{String(Math.floor(seconds/60)).padStart(2, '0')}:{String(seconds%60).padStart(2, '0')}</span>
              <Button variant="ghost" size="sm" onClick={toggleTimer} className="h-6 px-2">
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            <Select value={period} onValueChange={setPeriod as any}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Pre partita</SelectItem>
                <SelectItem value="first_half">1° Tempo</SelectItem>
                <SelectItem value="half_time">Intervallo</SelectItem>
                <SelectItem value="second_half">2° Tempo</SelectItem>
                <SelectItem value="extra_time">Supplementari</SelectItem>
                <SelectItem value="ended">Fine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />In campo</CardTitle>
            </CardHeader>
            <CardContent>
              {orderedOnFieldPlayers.length === 0 ? (
                <div className="text-muted-foreground text-sm">Nessun titolare impostato. Imposta l'11 dalla sezione Formazione.</div>
              ) : (
                <div className="space-y-1">
                  {orderedOnFieldPlayers.map((p: any) => {
                    const code = p._roleCode as string
                    const firstInitial = (p.first_name || '').trim().charAt(0)
                    const displayName = `${firstInitial ? firstInitial.toUpperCase() + '.' : ''} ${p.last_name || ''}`.trim()
                    return (
                      <div key={p.id} className={`px-2 py-1 rounded border flex items-center gap-2 ${flashId===p.id ? 'border-primary' : ''}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {code && code !== 'ALTRI' && (
                          <Badge variant="secondary" className="shrink-0 h-5 px-1 py-0 text-[11px] leading-none">{code}</Badge>
                        )}
                        <div className="truncate text-sm leading-tight">{displayName}</div>
                        {renderEventBadges(p.id)}
                        <div className="ml-auto flex items-center gap-1">
                          <Button aria-label="Gol" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); postEvent({ event_type: 'goal', team: 'us', player_id: p.id }) }}>
                            <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
                          </Button>
                          <Button aria-label="Assist" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); postEvent({ event_type: 'assist', player_id: p.id }) }}>
                            <span className="material-symbols-outlined text-[18px]">switch_access_shortcut_add</span>
                          </Button>
                          <Button aria-label="Ammonizione" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); postEvent({ event_type: 'yellow_card', player_id: p.id }) }}>
                            <span className="material-symbols-outlined text-[18px] text-yellow-500">crop_9_16</span>
                          </Button>
                          <Button aria-label="Espulsione" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); postEvent({ event_type: 'red_card', player_id: p.id }) }}>
                            <span className="material-symbols-outlined text-[18px] text-red-600">crop_9_16</span>
                          </Button>
                          <Button aria-label="Fallo" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); postEvent({ event_type: 'foul', player_id: p.id }) }}>
                            <span className="material-symbols-outlined text-[18px]">shield_person</span>
                          </Button>
                          <Button aria-label="Sostituzione" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); setSubOutId(p.id); setSubOpen(true) }}>
                            <span className="material-symbols-outlined text-[18px]">transfer_within_a_station</span>
                          </Button>
                          <Button aria-label="Nota" variant="ghost" size="icon" className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-inherit active:text-inherit focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-110 transition-transform duration-100" onClick={() => { flashRow(p.id); postEvent({ event_type: 'note', player_id: p.id, comment: `Nota su ${getDisplayName(p.id)}` }) }}>
                            <span className="material-symbols-outlined text-[18px]">note_add</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <Dialog open={subOpen} onOpenChange={setSubOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuova sostituzione</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Esce</Label>
                      <Select value={subOutId} onValueChange={setSubOutId}>
                        <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                        <SelectContent>
                          {Array.from(onFieldIds).map((id) => (
                            <SelectItem key={id} value={id}>{getDisplayName(id)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Entra</Label>
                      <Select value={subInId} onValueChange={setSubInId}>
                        <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                        <SelectContent>
                          {availableInIds.map((id) => (
                            <SelectItem key={id} value={id}>{getDisplayName(id)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSubOpen(false)}>Annulla</Button>
                      <Button onClick={doSubstitution} disabled={!subOutId || !subInId}><Repeat className="h-4 w-4 mr-1" /> Conferma</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-6">
                <div className="font-semibold mb-2">Eventi recenti</div>
                <div className="space-y-1">
                  {lastEvents.map((e: any) => (
                    <div key={e.id} className="text-sm text-muted-foreground flex items-center justify-between">
                       <div>
                         <span className="mr-2">[{e.minute ? `${e.minute}'` : new Date(e.created_at).toLocaleTimeString()}]</span>
                         <span className="mr-2">{e.event_type}</span>
                       {(e.player_id || e.trialist_id) && <span className="mr-2">{getDisplayName(e.player_id || e.trialist_id)}</span>}
                       </div>
                       <Button variant="ghost" size="icon" onClick={async()=>{ await supabase.from('match_events').delete().eq('id', e.id); queryClient.invalidateQueries({ queryKey: ['match-events', id] })}}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                  {lastEvents.length > 0 && (
                    <div>
                      <Button size="sm" variant="outline" onClick={async()=>{ const last = lastEvents[0]; await supabase.from('match_events').delete().eq('id', last.id); queryClient.invalidateQueries({ queryKey: ['match-events', id] })}}>Annulla ultimo evento</Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Convocati (Panchina) ({convocati.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {convocati.filter((p: any) => !onFieldIds.has(p.id)).map((p: any) => (
                  <div key={p.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${selectedPlayerId===p.id ? 'border-primary bg-primary/5' : ''}`} onClick={()=>setSelectedPlayerId(p.id)}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div className="truncate">{p.first_name} {p.last_name}</div>
                    {renderEventBadges(p.id)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Repeat className="h-5 w-5" />Sostituti ({substitutedList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {substitutedList.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nessun sostituito al momento.</div>
                )}
                {substitutedList.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 p-2 rounded border">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <div className="truncate">{getDisplayName(it.id)}</div>
                    {typeof it.minute === 'number' && (<span className="ml-auto text-xs text-muted-foreground">{it.minute}'</span>)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default MatchLive