import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePlayers } from '@/hooks/useSupabaseData'
import { usePlayerMatchStats } from '@/hooks/useSupabaseData'
import { usePlayerById, useFormerTrialistData } from '@/hooks/useSupabaseData'

const PlayerDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data: player } = usePlayerById(id || '')
  const { data: stats = [] } = usePlayerMatchStats(id || '')
  const { data: formerTrialist } = useFormerTrialistData(player as any)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{player ? `${player.first_name} ${player.last_name}` : 'Giocatore'}</h1>
          <Button asChild variant="ghost" size="sm"><Link to="/squad">Torna a Squad</Link></Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><div className="text-muted-foreground">Nome</div><div className="font-medium">{player?.first_name} {player?.last_name}</div></div>
              <div><div className="text-muted-foreground">Email</div><div className="font-medium">{player?.email || '-'}</div></div>
              <div><div className="text-muted-foreground">Telefono</div><div className="font-medium">{player?.phone || '-'}</div></div>
              <div><div className="text-muted-foreground">Data nascita</div><div className="font-medium">{player?.birth_date ? new Date(player.birth_date).toLocaleDateString() : '-'}</div></div>
              <div><div className="text-muted-foreground">Numero maglia</div><div className="font-medium">{player?.jersey_number ?? '-'}</div></div>
              <div><div className="text-muted-foreground">Ruolo</div><div className="font-medium">{(player as any)?.role_code || '-'}</div></div>
              <div><div className="text-muted-foreground">Stato</div><div className="font-medium">{player?.status || '-'}</div></div>
              <div><div className="text-muted-foreground">Note</div><div className="font-medium whitespace-pre-wrap">{player?.notes || '-'}</div></div>
            </div>
          </CardContent>
        </Card>

        {formerTrialist && (
          <Card>
            <CardHeader><CardTitle>Storico provenienza (Provinante)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                <div><div className="text-muted-foreground">Periodo prova</div><div className="font-medium">{formerTrialist?.created_at ? new Date(formerTrialist.created_at).toLocaleDateString() : '-'} → {formerTrialist?.updated_at ? new Date(formerTrialist.updated_at).toLocaleDateString() : '-'}</div></div>
                <div><div className="text-muted-foreground">Ruolo</div><div className="font-medium">{formerTrialist?.role_code || '-'}</div></div>
              </div>
              <div className="text-sm font-semibold mb-2">Valutazioni in prova</div>
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
                      <tr><td className="py-4 text-muted-foreground" colSpan={7}>Nessuna valutazione di prova trovata.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Riepilogo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><div className="text-muted-foreground">Partite</div><div className="font-semibold">{totals.matches}</div></div>
              <div><div className="text-muted-foreground">Titolare</div><div className="font-semibold">{totals.started}</div></div>
              <div><div className="text-muted-foreground">Minuti</div><div className="font-semibold">{totals.minutes}</div></div>
              <div><div className="text-muted-foreground">Gol</div><div className="font-semibold">{totals.goals}</div></div>
              <div><div className="text-muted-foreground">Assist</div><div className="font-semibold">{totals.assists}</div></div>
              <div><div className="text-muted-foreground">Gialli</div><div className="font-semibold">{totals.yellows}</div></div>
              <div><div className="text-muted-foreground">Rossi</div><div className="font-semibold">{totals.reds}</div></div>
              <div><div className="text-muted-foreground">Falli</div><div className="font-semibold">{totals.fouls}</div></div>
              <div><div className="text-muted-foreground">Parate</div><div className="font-semibold">{totals.saves}</div></div>
            </div>
          </CardContent>
        </Card>

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
                  </tr>
                </thead>
                <tbody>
                  {stats.map((r:any)=>{
                    const m = r.matches
                    const date = m?.match_date ? new Date(m.match_date).toLocaleDateString() : ''
                    const opp = m?.opponents?.name || m?.opponent_name || '-'
                    const res = `${m?.our_score ?? '-'} - ${m?.opponent_score ?? '-'}`
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
                      </tr>
                    )
                  })}
                  {stats.length === 0 && (
                    <tr><td className="py-6 text-muted-foreground" colSpan={9}>Nessuna partita registrata.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PlayerDetail