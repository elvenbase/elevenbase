import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePlayers } from '@/hooks/useSupabaseData'

const PlayerDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data: players = [] } = usePlayers()
  const player = players.find((p:any)=>p.id === id)

  if (!id) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dettaglio giocatore</h1>
          <Button asChild variant="ghost" size="sm"><Link to="/squad">Torna a Squad</Link></Button>
        </div>
        <Card>
          <CardHeader><CardTitle>{player ? `${player.first_name} ${player.last_name}` : id}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Pagina in costruzione: statistiche cumulative e storico partite.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PlayerDetail