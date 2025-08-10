import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plus, Target, Copy, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { useMatches, useCloneMatch, useDeleteMatch } from '@/hooks/useSupabaseData'
import { MatchForm } from '@/components/forms/MatchForm'
import { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches()
  const cloneMatch = useCloneMatch()
  const deleteMatch = useDeleteMatch()
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set())

  const onClone = (id: string) => cloneMatch.mutate(id)
  const onDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa partita? L\'operazione è irreversibile.')) {
      deleteMatch.mutate(id)
    }
  }
  const toggleExpanded = (id: string) => {
    const next = new Set(expandedMatches)
    if (next.has(id)) next.delete(id); else next.add(id)
    setExpandedMatches(next)
  }
  const getMatchStatusBadge = (m: any) => {
    if (m.status === 'completed') return <Badge variant="outline">Completata</Badge>
    const dt = new Date(m.match_date + 'T' + (m.match_time || '00:00'))
    const now = new Date()
    if (dt < now) return <Badge variant="secondary">Passata</Badge>
    return <Badge variant="default">Programmata</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">Partite Ufficiali</h1>
            <p className="text-muted-foreground">Gestisci e registra eventi live delle partite ufficiali</p>
          </div>
          <MatchForm>
            <Button className="space-x-2 w-full sm:w-auto">
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
                {matches.map((m: any) => {
                  const isExpanded = expandedMatches.has(m.id)
                  const title = `${m.home_away === 'home' ? 'vs' : '@'} ${m.opponent_name}`
                  return (
                    <div key={m.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate" title={title}>{title}</span>
                            <Badge variant="outline">{m.home_away === 'home' ? 'Casa' : 'Trasferta'}</Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 min-w-0">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate whitespace-nowrap">{new Date(m.match_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">{m.match_time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">{getMatchStatusBadge(m)}</div>
                      </div>

                      {/* Primary action */}
                      <Link to={`/match/${m.id}`} className="block mt-3">
                        <Button className="w-full bg-gradient-primary text-white hover:opacity-90">
                          <Settings className="h-4 w-4 mr-2 text-white" />
                          Gestisci Partita
                        </Button>
                      </Link>

                      {/* Expand/collapse */}
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpanded(m.id)}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-foreground hover:text-foreground focus-visible:bg-primary focus-visible:text-primary-foreground active:bg-primary active:text-primary-foreground"
                      >
                        <span className="text-xs sm:text-sm">{isExpanded ? 'Nascondi opzioni' : 'Mostra altre opzioni'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" className="w-full justify-start" onClick={() => onClone(m.id)} disabled={cloneMatch.isPending}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clona Partita
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Elimina Partita
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione non può essere annullata. Verranno eliminati anche dati collegati.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Matches