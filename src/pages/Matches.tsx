import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Clock, Plus, Target, Copy, Trash2, Settings, ChevronDown, ChevronUp, MoreHorizontal, Eye, Users } from 'lucide-react'
import { useMatches, useCloneMatch, useDeleteMatch, usePlayers } from '@/hooks/useSupabaseData'
import { MatchForm } from '@/components/forms/MatchForm'
import { useMemo, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import StatsCard from '@/components/StatsCard'

const MiniJersey = ({ o }: { o: any }) => {
  if (!o) return null
  if (o.jersey_image_url) return <img src={o.jersey_image_url} alt="jersey" className="h-5 w-5 rounded object-cover" />
  const shape = o.jersey_shape as 'classic'|'stripes'|'hoops'|undefined
  const p = o.jersey_primary_color || '#008080'
  const s = o.jersey_secondary_color || '#ffffff'
  const style: React.CSSProperties = {}
  if (shape === 'stripes') {
    style.backgroundImage = `repeating-linear-gradient(90deg, ${p} 0 6px, ${s} 6px 12px)`
  } else if (shape === 'hoops') {
    style.backgroundImage = `repeating-linear-gradient(0deg, ${p} 0 6px, ${s} 6px 12px)`
  } else {
    style.backgroundColor = p
  }
  return <div className="h-5 w-5 rounded border" style={style} />
}

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches()
  const { data: players = [] } = usePlayers()
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

  const isMatchArchived = (m: any) => {
    if (m.status === 'completed') return true
    const endDate = new Date(m.match_date + 'T' + (m.match_time || '00:00'))
    // Considera archiviata dopo 48h dalla data
    const now = new Date()
    const diffH = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60)
    return diffH > 48
  }

  const getMatchStatusBadge = (m: any) => {
    if (m.status === 'completed') return <Badge variant="outline">Completata</Badge>
    const dt = new Date(m.match_date + 'T' + (m.match_time || '00:00'))
    const now = new Date()
    if (dt < now) return <Badge variant="secondary">Passata</Badge>
    return <Badge variant="default">Programmata</Badge>
  }

  const separatedMatches = useMemo(() => {
    const active = matches.filter((m: any) => !isMatchArchived(m)).sort((a: any, b: any) => {
      const da = new Date(a.match_date + 'T' + (a.match_time || '00:00')).getTime()
      const db = new Date(b.match_date + 'T' + (b.match_time || '00:00')).getTime()
      const now = Date.now()
      if (da >= now && db >= now) return da - db // future ascending
      if (da < now && db < now) return db - da // past descending
      return da >= now ? -1 : 1
    })
    const archived = matches.filter((m: any) => isMatchArchived(m)).sort((a: any, b: any) => {
      const da = new Date(a.match_date + 'T' + (a.match_time || '00:00')).getTime()
      const db = new Date(b.match_date + 'T' + (b.match_time || '00:00')).getTime()
      return db - da
    })
    return { active, archived }
  }, [matches])

  const nextMatch = useMemo(() => {
    const future = matches.filter((m: any) => new Date(m.match_date + 'T' + (m.match_time || '00:00')).getTime() >= Date.now())
    return future.sort((a: any, b: any) => new Date(a.match_date + 'T' + (a.match_time || '00:00')).getTime() - new Date(b.match_date + 'T' + (b.match_time || '00:00')).getTime())[0]
  }, [matches])

  const MatchCardMobile = ({ m }: { m: any }) => {
    const isExpanded = expandedMatches.has(m.id)
    const title = `${m.home_away === 'home' ? 'vs' : '@'} ${m.opponent_name}`
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {m.opponents?.logo_url && (
                    <img src={m.opponents.logo_url} alt={m.opponents?.name || 'logo'} className="h-6 w-6 rounded object-cover" />
                  )}
                  <span className="font-semibold truncate" title={title}>{title}</span>
                  <MiniJersey o={m.opponents} />
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

            <Link to={`/match/${m.id}`} className="block">
              <Button className="w-full bg-gradient-primary text-white hover:opacity-90">
                <Settings className="h-4 w-4 mr-2 text-white" />
                Gestisci Partita
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={() => toggleExpanded(m.id)}
              className="w-full flex items-center justify-center gap-2 text-foreground hover:text-foreground focus-visible:bg-primary focus-visible:text-primary-foreground active:bg-primary active:text-primary-foreground"
            >
              <span className="text-xs sm:text-sm">{isExpanded ? 'Nascondi opzioni' : 'Mostra altre opzioni'}</span>
              {isExpanded ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">Partite Ufficiali</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gestisci e registra eventi live delle partite ufficiali</p>
          </div>
          <MatchForm>
            <Button className="w-full sm:w-auto space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuova Partita</span>
            </Button>
          </MatchForm>
        </div>

        {/* Stats grid (mirrors Training style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard title="Totali" value={matches.length} icon={Calendar} description="Partite totali" />
          <StatsCard title="Prossima" value={nextMatch ? new Date(nextMatch.match_date).toLocaleDateString() : 'N/A'} icon={Clock} description={nextMatch?.match_time || 'Nessuna partita'} />
          <StatsCard title="Attive" value={separatedMatches.active.length} icon={Target} description="Programmate/Recenti" />
          <StatsCard title="Giocatori Attivi" value={players.filter((p: any) => p.status === 'active').length} icon={Users} description="Totale squadra" />
        </div>

        {/* Desktop table view */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Elenco Partite</CardTitle>
              <CardDescription>Gestisci partite, duplica o elimina dalla tabella</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Caricamento partite...</p>
                </div>
              ) : separatedMatches.active.length > 0 || separatedMatches.archived.length > 0 ? (
                <div className="space-y-6">
                  {separatedMatches.active.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Partite Attive</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Avversario</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ora</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {separatedMatches.active.map((m: any) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {m.opponents?.logo_url && (
                                    <img src={m.opponents.logo_url} alt={m.opponents?.name || 'logo'} className="h-6 w-6 rounded object-cover" />
                                  )}
                                  <span>{m.home_away === 'home' ? 'vs' : '@'} {m.opponent_name}</span>
                                  <MiniJersey o={m.opponents} />
                                  <Badge variant="outline">{m.home_away === 'home' ? 'Casa' : 'Trasferta'}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(m.match_date).toLocaleDateString()}</TableCell>
                              <TableCell>{m.match_time}</TableCell>
                              <TableCell>{getMatchStatusBadge(m)}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-foreground">
                                      <span className="sr-only">Apri menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/match/${m.id}`} className="flex items-center">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Gestisci Partita
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onClone(m.id) }}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Clona
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                          <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onDelete(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {separatedMatches.archived.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Archiviate ({separatedMatches.archived.length})</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Avversario</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ora</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {separatedMatches.archived.map((m: any) => (
                            <TableRow key={m.id} className="opacity-75">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {m.opponents?.logo_url && (
                                    <img src={m.opponents.logo_url} alt={m.opponents?.name || 'logo'} className="h-6 w-6 rounded object-cover" />
                                  )}
                                  <span>{m.home_away === 'home' ? 'vs' : '@'} {m.opponent_name}</span>
                                  <MiniJersey o={m.opponents} />
                                  <Badge variant="outline">{m.home_away === 'home' ? 'Casa' : 'Trasferta'}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(m.match_date).toLocaleDateString()}</TableCell>
                              <TableCell>{m.match_time}</TableCell>
                              <TableCell>{getMatchStatusBadge(m)}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-foreground">
                                      <span className="sr-only">Apri menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/match/${m.id}`} className="flex items-center">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizza Partita
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Elimina
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                          <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onDelete(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nessuna partita trovata</h3>
                  <p className="text-muted-foreground mb-4">Inizia creando la tua prima partita ufficiale</p>
                  <MatchForm>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Partita
                    </Button>
                  </MatchForm>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile cards view */}
        <div className="lg:hidden">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-semibold mb-2">Elenco Partite</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Tocca "Gestisci Partita" per accedere rapidamente alla gestione</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Caricamento partite...</p>
            </div>
          ) : (separatedMatches.active.length > 0 || separatedMatches.archived.length > 0) ? (
            <div className="space-y-6">
              {separatedMatches.active.length > 0 && (
                <div className="space-y-4">
                  {separatedMatches.active.map((m: any) => (
                    <MatchCardMobile key={m.id} m={m} />
                  ))}
                </div>
              )}
              {separatedMatches.archived.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-muted-foreground">Archiviate ({separatedMatches.archived.length})</h3>
                    <p className="text-xs text-muted-foreground">Partite concluse o terminate da più di 48 ore</p>
                  </div>
                  <div className="space-y-4">
                    {separatedMatches.archived.map((m: any) => (
                      <div key={m.id} className="opacity-75">
                        <MatchCardMobile m={m} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna partita trovata</h3>
              <p className="text-muted-foreground mb-4">Inizia creando la tua prima partita ufficiale</p>
              <MatchForm>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Partita
                </Button>
              </MatchForm>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Matches