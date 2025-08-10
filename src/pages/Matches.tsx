import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plus, Target, Copy, Trash2 } from 'lucide-react'
import { useMatches, useCloneMatch, useDeleteMatch } from '@/hooks/useSupabaseData'
import { MatchForm } from '@/components/forms/MatchForm'

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches()
  const cloneMatch = useCloneMatch()
  const deleteMatch = useDeleteMatch()

  const onClone = (id: string) => cloneMatch.mutate(id)
  const onDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa partita? L\'operazione è irreversibile.')) {
      deleteMatch.mutate(id)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">Partite Ufficiali</h1>
            <p className="text-muted-foreground">Gestisci e registra eventi live delle partite ufficiali</p>
          </div>
          <MatchForm>
            <Button className="space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuova Partita</span>
            </Button>
          </MatchForm>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Elenco Partite</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nessuna partita presente</div>
            ) : (
              <div className="space-y-3">
                {matches.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{m.home_away === 'home' ? 'vs' : '@'} {m.opponent_name}</span>
                        <Badge variant="outline">{m.home_away === 'home' ? 'Casa' : 'Trasferta'}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 min-w-0">
                          <Calendar className="h-4 w-4" />
                          <span className="truncate whitespace-nowrap">{new Date(m.match_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="whitespace-nowrap">{m.match_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" title="Clona" onClick={() => onClone(m.id)} disabled={cloneMatch.isPending}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" title="Elimina" onClick={() => onDelete(m.id)} disabled={deleteMatch.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link to={`/match/${m.id}`}>
                        <Button variant="outline" className="space-x-2">
                          <Target className="h-4 w-4" />
                          <span>Vai</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Matches