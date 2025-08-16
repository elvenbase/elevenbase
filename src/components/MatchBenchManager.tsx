import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, UserCheck, UserX, Plus, Trash2, Info, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
  avatar_url?: string
  status?: string
  isTrialist?: boolean
}

interface AttendanceRec {
  player_id: string
  status: 'pending' | 'present' | 'absent' | 'late' | 'excused'
}

interface BenchRec {
  id: string
  match_id: string
  player_id?: string
  trialist_id?: string
  notes?: string
  created_at: string
}

interface MatchBenchManagerProps {
  matchId: string
  allPlayers: Player[]
  attendance?: AttendanceRec[]
  playersInLineup?: string[]
  isReadOnly?: boolean
}

const MatchBenchManager = ({ matchId, allPlayers, attendance = [], playersInLineup = [], isReadOnly = false }: MatchBenchManagerProps) => {
  const [bench, setBench] = useState<BenchRec[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  const availablePlayers = useMemo(() => allPlayers.filter(p => !playersInLineup.includes(p.id)), [allPlayers, playersInLineup])
  const presentPlayers = useMemo(() => availablePlayers.filter(player => attendance.find(a => a.player_id === player.id)?.status === 'present'), [availablePlayers, attendance])

  // Roster-only utilities for counts that should not include trialists
  const rosterPlayers = useMemo(() => allPlayers.filter(p => !p.isTrialist), [allPlayers])

  useEffect(() => { loadBench() }, [matchId])

  const loadBench = async () => {
    if (!matchId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('match_bench')
        .select(`*, players:player_id(id, first_name, last_name, jersey_number, avatar_url), trialists:trialist_id(id, first_name, last_name, avatar_url)`) 
        .eq('match_id', matchId)
      if (error) throw error
      const typed = (data || []) as BenchRec[]
      setBench(typed)
      setSelectedPlayers(typed.map(b => (b.player_id || b.trialist_id) as string).filter(Boolean))
    } catch (e) {
      console.error('Errore nel caricare la panchina match:', e)
      toast.error('Errore nel caricare la panchina')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayerSelection = (playerId: string) => {
    if (isReadOnly) return
    setSelectedPlayers(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId])
  }

  const saveBench = async () => {
    if (!matchId) return
    setLoading(true)
    try {
      await supabase.from('match_bench').delete().eq('match_id', matchId)
      if (selectedPlayers.length > 0) {
        const rosterIds: string[] = []
        const trialistIds: string[] = []
        selectedPlayers.forEach(id => {
          const p = allPlayers.find(pl => pl.id === id)
          if (p?.isTrialist) trialistIds.push(id)
          else rosterIds.push(id)
        })

        if (rosterIds.length > 0) {
          const rows = rosterIds.map(player_id => ({ match_id: matchId, player_id }))
          const { error } = await supabase.from('match_bench').insert(rows)
          if (error) throw error
        }

        if (trialistIds.length > 0) {
          const trows = trialistIds.map(trialist_id => ({ match_id: matchId, trialist_id }))
          const { error: terr } = await supabase.from('match_bench').insert(trows)
          if (terr) throw terr
        }
      }
      await loadBench()
      toast.success('Panchina partita salvata')
    } catch (e: any) {
      console.error('Errore salvataggio panchina match:', e?.message || e, e)
      toast.error(`Errore nel salvare la panchina${e?.message ? `: ${e.message}` : ''}`)
    } finally {
      setLoading(false)
    }
  }

  const removeFromBench = async (benchId: string) => {
    if (isReadOnly) return
    setLoading(true)
    try {
      const { error } = await supabase.from('match_bench').delete().eq('id', benchId)
      if (error) throw error
      setBench(prev => prev.filter(b => b.id !== benchId))
      toast.success('Giocatore rimosso dalla panchina')
    } catch (e) {
      console.error('Errore rimozione panchina match:', e)
      toast.error('Errore nella rimozione')
    } finally {
      setLoading(false)
    }
  }

  const getPlayerById = (id: string) => allPlayers.find(p => p.id === id)

  const presentiCount = attendance.filter(a => a.status === 'present').length
  const titolariCount = playersInLineup.length
  const convocatiCount = bench.length
  const eleggibiliCount = presentPlayers.length
  const disponibiliNonSelezionati = Math.max(0, eleggibiliCount - convocatiCount)
  const indisponibiliCount = rosterPlayers.filter(player => {
    const a = attendance.find(x => x.player_id === player.id)
    const rosterStatus = (player.status || 'active')
    const notActive = rosterStatus !== 'active' && rosterStatus !== undefined
    return a?.status === 'absent' || a?.status === 'excused' || notActive
  }).length
  const senzaRispostaCount = rosterPlayers.filter(player => {
    const a = attendance.find(x => x.player_id === player.id)
    return !a || a.status === 'pending'
  }).length
  const totaleConvocati = titolariCount + convocatiCount

  const allPresentSelected = presentPlayers.length > 0 && presentPlayers.every(p => selectedPlayers.includes(p.id))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><div><p className="text-2xl font-bold text-green-600">{presentiCount}</p><p className="text-sm text-muted-foreground">Presenti</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" /><div><p className="text-2xl font-bold text-purple-600">{titolariCount}</p><p className="text-sm text-muted-foreground">Titolari</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-blue-600" /><div><p className="text-2xl font-bold text-blue-600">{convocatiCount}</p><p className="text-sm text-muted-foreground">Panchina</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-gray-600" /><div><p className="text-2xl font-bold text-gray-600">{disponibiliNonSelezionati}</p><p className="text-sm text-muted-foreground">Disponibili non selezionati</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><UserX className="h-5 w-5 text-red-600" /><div><p className="text-2xl font-bold text-red-600">{indisponibiliCount}</p><p className="text-sm text-muted-foreground">Indisponibili</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-600" /><div><p className="text-2xl font-bold text-amber-600">{senzaRispostaCount}</p><p className="text-sm text-muted-foreground">Senza risposta</p></div></div></CardContent></Card>
      </div>
      <div className="text-sm text-muted-foreground">{titolariCount} titolari + {convocatiCount} panchina = {totaleConvocati} convocati totali</div>

      {!isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Seleziona Convocati</CardTitle>
            <CardDescription>Seleziona i presenti da aggiungere alla panchina</CardDescription>
          </CardHeader>
          <CardContent>
            {presentPlayers.length === 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800"><Info className="h-4 w-4" /><p className="text-sm"><strong>Nessun giocatore presente.</strong></p></div>
              </div>
            )}

            {presentPlayers.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setSelectedPlayers(presentPlayers.map(p => p.id))} disabled={allPresentSelected} className="flex items-center gap-2 w-full sm:w-auto">
                    <CheckCircle className="h-4 w-4" />
                    {allPresentSelected ? 'Tutti selezionati' : `Convoca tutti (${presentPlayers.length})`}
                  </Button>
                  {selectedPlayers.length > 0 && (
                    <Button variant="outline" onClick={() => setSelectedPlayers([])} className="flex items-center gap-2 w-full sm:w-auto">
                      <XCircle className="h-4 w-4" /> Deseleziona tutti
                    </Button>
                  )}
                </div>
                {selectedPlayers.length > 0 && (<span className="text-sm text-muted-foreground">{selectedPlayers.length}/{presentPlayers.length} selezionati</span>)}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {presentPlayers.map((player) => (
                <div key={player.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlayers.includes(player.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => togglePlayerSelection(player.id)}>
                  <Checkbox checked={selectedPlayers.includes(player.id)} onChange={() => togglePlayerSelection(player.id)} />
                  <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span className="truncate">{player.first_name} {player.last_name}</span>
                      {player.isTrialist && <Badge variant="secondary" className="text-[10px] px-1 py-0">provinante</Badge>}
                    </p>
                    {player.jersey_number && (<p className="text-xs text-muted-foreground">#{player.jersey_number}</p>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={saveBench} disabled={selectedPlayers.length === 0 || loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> {loading ? 'Salvando...' : 'Salva Panchina'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {bench.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Lista Panchina</CardTitle>
            <CardDescription>Giocatori selezionati per la panchina</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bench.map((rec) => {
                const player = getPlayerById(rec.player_id || rec.trialist_id || '')
                if (!player) return null
                return (
                  <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <PlayerAvatar firstName={player.first_name} lastName={player.last_name} avatarUrl={player.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{player.first_name} {player.last_name}</p>
                        {player.isTrialist && (<Badge variant="secondary" className="text-[10px] px-1 py-0">provinante</Badge>)}
                        {player.jersey_number && (<Badge variant="outline" className="text-xs">#{player.jersey_number}</Badge>)}
                        {(player as any).role_code && (<Badge variant="secondary" className="text-xs">{(player as any).role_code}</Badge>)}
                      </div>
                    </div>
                    {!isReadOnly && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rimuovi dalla panchina</AlertDialogTitle>
                            <AlertDialogDescription>Sei sicuro di voler rimuovere {player.first_name} {player.last_name}?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeFromBench(rec.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Rimuovi</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {bench.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun giocatore in panchina</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MatchBenchManager