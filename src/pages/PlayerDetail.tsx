import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePlayerMatchStats } from '@/hooks/useSupabaseData'
import { usePlayerNoteEvents } from '@/hooks/useSupabaseData'
import { usePlayerById, useFormerTrialistData } from '@/hooks/useSupabaseData'
import { usePlayerAttendanceSummary } from '@/hooks/useSupabaseData'
import { useRoles } from '@/hooks/useRoles'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Upload } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useUpdatePlayer } from '@/hooks/useSupabaseData'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const PlayerDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data: player } = usePlayerById(id || '')
  const { data: stats = [] } = usePlayerMatchStats(id || '')
  const { data: noteEvents = [] } = usePlayerNoteEvents(id || '')
  const { data: formerTrialist } = useFormerTrialistData(player as any)
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
    return acc
  }, { matches: 0, started: 0, minutes: 0, goals: 0, assists: 0, yellows: 0, reds: 0, fouls: 0, saves: 0 })

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
        <div className={`rounded-2xl border border-border/30 bg-gradient-to-r ${sectorTheme.from} ${sectorTheme.to} p-4 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <PlayerAvatar firstName={player?.first_name} lastName={player?.last_name} avatarUrl={player?.avatar_url} size={80} />
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold leading-tight">{shortName}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">#{player?.jersey_number ?? '-'}</Badge>
                  <Badge className={`${sectorTheme.chip} font-semibold`}>{roleLabel}</Badge>
                </div>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0"><Link to="/squad">Torna a Squad</Link></Button>
          </div>
        </div>

        <Tabs defaultValue="profilo" className="w-full">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="profilo">Profilo</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="presenze">Presenze</TabsTrigger>
            <TabsTrigger value="partite">Partite</TabsTrigger>
            {formerTrialist && (<TabsTrigger value="prova">Prova</TabsTrigger>)}
          </TabsList>

          <TabsContent value="profilo">
            <Card>
              <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <PlayerAvatar firstName={player?.first_name} lastName={player?.last_name} avatarUrl={player?.avatar_url} size={96} />
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      <Upload className="w-4 h-4" /> Carica
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><div className="text-muted-foreground">Nome</div><div className="font-medium">{player?.first_name}</div></div>
                    <div><div className="text-muted-foreground">Cognome</div><div className="font-medium">{player?.last_name}</div></div>
                    <div><div className="text-muted-foreground">Numero Maglia</div><div className="font-medium">{player?.jersey_number ?? '-'}</div></div>
                    <div><div className="text-muted-foreground">Ruolo</div><div className="font-medium">{roleLabel}</div></div>
                    <div><div className="text-muted-foreground">Telefono</div><div className="font-medium">{phoneView.number ? `${phoneView.prefix} ${phoneView.number}` : '-'}</div></div>
                    <div><div className="text-muted-foreground">📅 Data di Nascita</div><div className="font-medium">{player?.birth_date ? new Date(player.birth_date).toLocaleDateString() : '-'}</div></div>
                    <div><div className="text-muted-foreground">📧 Email</div><div className="font-medium">{player?.email || '-'}</div></div>
                    <div><div className="text-muted-foreground">📝 Note</div><div className="font-medium whitespace-pre-wrap">{player?.notes || '-'}</div></div>
                    <div><div className="text-muted-foreground">Stato</div><div className="font-medium">{player?.status || '-'}</div></div>
                    <div className="col-span-2"><div className="text-muted-foreground">🏆 Esperienza Sportiva</div><div className="font-medium whitespace-pre-wrap">{player?.esperienza || '-'}</div></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader><CardTitle>Informazioni Gaming (opzionali)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div><div className="text-muted-foreground">EA Sports ID</div><div className="font-medium">{(player as any)?.ea_sport_id || '-'}</div></div>
                  <div><div className="text-muted-foreground">Piattaforma Gaming</div><div className="font-medium">{(player as any)?.gaming_platform || 'Seleziona piattaforma'}</div></div>
                  <div><div className="text-muted-foreground">Platform ID</div><div className="font-medium">{(player as any)?.platform_id || '-'}</div></div>
                </div>
              </CardContent>
            </Card>
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
                        <div key={i} className="bg-rose-500/80 rounded-t" style={{ height: `${Math.max(6, ((s.goals || 0)/maxGA)*100)}%`, width: '8px' }} />
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