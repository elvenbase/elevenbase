import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, UserCheck, UserX, Plus, X, Info, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
  avatar_url?: string
  status: 'active' | 'inactive' | 'injured' | 'suspended'
  isTrialist?: boolean
}

interface Attendance {
  id: string
  player_id: string
  status: 'pending' | 'present' | 'absent' | 'late'
}

interface Convocato {
  id: string
  session_id: string
  player_id?: string
  trialist_id?: string
  notes?: string
  created_at: string
  players?: Player
}

interface ConvocatiManagerProps {
  sessionId: string
  allPlayers: Player[]
  attendance?: Attendance[]
  playersInLineup?: string[]
  isReadOnly?: boolean
  onConvocatiChange?: (ids: string[]) => void
}

export const ConvocatiManager = ({ sessionId, allPlayers, attendance, playersInLineup = [], isReadOnly = false, onConvocatiChange }: ConvocatiManagerProps) => {
  const [convocati, setConvocati] = useState<Convocato[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Tutti i presenti (inclusi eventuali titolari) sono eleggibili ai convocati
  const presentPlayers = allPlayers.filter(player => {
    const playerAttendance = attendance?.find(a => a.player_id === player.id);
    return playerAttendance?.status === 'present';
  })
  
  // Giocatori disponibili per selezione (esclusi quelli già convocati)
  const availablePlayersForSelection = presentPlayers.filter(player => {
    // Escludi giocatori già convocati
    const isAlreadyConvocato = convocati.some(c => c.player_id === player.id);
    return !isAlreadyConvocato;
  })
  
  // Notifica al parent ogni volta che cambia la selezione dei convocati
  useEffect(() => {
    onConvocatiChange?.(selectedPlayers)
  }, [selectedPlayers])

  // Carica i convocati esistenti
  useEffect(() => {
    loadConvocati()
  }, [sessionId])

  const loadConvocati = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      // Query diretta con join a players e trialists
      const { data, error } = await supabase
        .from('training_convocati')
        .select(`
          *,
          players:player_id(id, first_name, last_name, jersey_number, avatar_url),
          trialists:trialist_id(id, first_name, last_name, avatar_url)
        `)
        .eq('session_id', sessionId)

      if (error) throw error
      
      // Type assertion per gestire il tipo che arriva dal database
      const typedData = (data || []) as Convocato[]
      setConvocati(typedData)
      const preSelected = typedData.map(c => (c.player_id || c.trialist_id) as string).filter(Boolean)
      setSelectedPlayers(preSelected)
      onConvocatiChange?.(preSelected)
    } catch (error) {
      console.error('Errore nel caricare i convocati:', error)
      toast.error('Errore nel caricare i convocati')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayerSelection = (playerId: string) => {
    if (isReadOnly) return

    setSelectedPlayers(prev => {
      const newSelection = prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
      return newSelection
    })
  }

  const saveConvocati = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      // Prima elimina tutti i convocati esistenti
      await supabase
        .from('training_convocati')
        .delete()
        .eq('session_id', sessionId)

      // Partiziona selezioni: tesserati vs provinanti
      const rosterIds: string[] = []
      const trialistIds: string[] = []
      selectedPlayers.forEach(id => {
        const p = allPlayers.find(pl => pl.id === id)
        if (p?.isTrialist) trialistIds.push(id)
        else rosterIds.push(id)
      })

      // Inserisce solo i tesserati nel DB (FK su players)
      if (rosterIds.length > 0) {
        const convocatiToInsert = rosterIds.map(playerId => ({
          session_id: sessionId,
          player_id: playerId
        }))

        const { error } = await supabase
          .from('training_convocati')
          .insert(convocatiToInsert)

        if (error) throw error
      }

      // Inserisce anche i provinanti (colonna trialist_id)
      if (trialistIds.length > 0) {
        const trialRows = trialistIds.map(trialist_id => ({ session_id: sessionId, trialist_id }))
        const { error: trialErr } = await supabase
          .from('training_convocati')
          .insert(trialRows)
        if (trialErr) throw trialErr
      }

      await loadConvocati()
      toast.success('Convocati salvati con successo')
    } catch (error: any) {
      console.error('Errore nel salvare i convocati:', error?.message || error, error)
      toast.error(`Errore nel salvare i convocati${error?.message ? `: ${error.message}` : ''}`)
    } finally {
      setLoading(false)
    }
  }



  const confirmRemoveConvocato = async (convocatoId: string) => {
    if (isReadOnly) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('training_convocati')
        .delete()
        .eq('id', convocatoId)

      if (error) throw error

      setConvocati(prev => prev.filter(c => c.id !== convocatoId))
      toast.success('Giocatore rimosso dalla panchina con successo')
    } catch (error) {
      console.error('Errore nella rimozione del giocatore:', error)
      toast.error('Errore nella rimozione del giocatore')
    } finally {
      setLoading(false)
    }
  }

  const getPlayerById = (playerId: string) => {
    return allPlayers.find(p => p.id === playerId)
  }

  const selectAllPresentPlayers = () => {
    const allAvailableIds = availablePlayersForSelection.map(player => player.id)
    setSelectedPlayers(allAvailableIds)
  }

  const deselectAllPlayers = () => {
    setSelectedPlayers([])
  }

  // Calcolo nuove statistiche richieste
  const titolariCount = playersInLineup.length
  const presentiCount = attendance?.filter(a => a.status === 'present').length || 0
  const eleggibiliCount = presentPlayers.length // tutti i presenti
  const convocatiCount = convocati.length
  const disponibiliNonSelezionati = Math.max(0, eleggibiliCount - convocatiCount)
  const indisponibiliCount = allPlayers.filter(player => {
    const playerAttendance = attendance?.find(a => a.player_id === player.id)
    return player.status !== 'active' || 
           playerAttendance?.status === 'absent' || 
           false
  }).length
  const senzaRispostaCount = allPlayers.filter(player => {
    const a = attendance?.find(x => x.player_id === player.id)
    return !a || a.status === 'pending'
  }).length
  const totaleConvocati = titolariCount + convocatiCount
  
  const allAvailableSelected = availablePlayersForSelection.length > 0 && availablePlayersForSelection.every(player => selectedPlayers.includes(player.id))

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{presentiCount}</p>
                <p className="text-sm text-muted-foreground">Presenti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{titolariCount}</p>
                <p className="text-sm text-muted-foreground">Titolari</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{convocatiCount}</p>
                <p className="text-sm text-muted-foreground">Convocati</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-600">{disponibiliNonSelezionati}</p>
                <p className="text-sm text-muted-foreground">Disponibili non selezionati</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{indisponibiliCount}</p>
                <p className="text-sm text-muted-foreground">Indisponibili</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{senzaRispostaCount}</p>
                <p className="text-sm text-muted-foreground">Senza risposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Riepilogo sintetico */}
      <div className="text-sm text-muted-foreground">
        {titolariCount} titolari + {convocatiCount} convocati = {totaleConvocati} convocati totali
      </div>

      {/* Selezione convocati */}
      {!isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Seleziona Convocati
            </CardTitle>
            <CardDescription>
              Seleziona i presenti da convocare
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Messaggio informativo sul filtro */}
            {presentPlayers.length === 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <p className="text-sm">Nessun giocatore presente disponibile per la convocazione.</p>
                </div>
              </div>
            )}

            {/* Pulsanti di controllo selezione */}
            {presentPlayers.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="grid grid-cols-1 sm:auto-cols-max sm:grid-flow-col gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={selectAllPresentPlayers}
                    disabled={allAvailableSelected || availablePlayersForSelection.length === 0}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {allAvailableSelected ? 'Tutti selezionati' : `Convoca tutti (${availablePlayersForSelection.length})`}
                  </Button>
                  {selectedPlayers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={deselectAllPlayers}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4" />
                      Deseleziona tutti
                    </Button>
                  )}
                </div>
                {selectedPlayers.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedPlayers.length}/{presentPlayers.length} selezionati
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {availablePlayersForSelection.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlayers.includes(player.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => togglePlayerSelection(player.id)}
                >
                  <Checkbox
                    checked={selectedPlayers.includes(player.id)}
                    onChange={() => togglePlayerSelection(player.id)}
                  />
                  <PlayerAvatar
                    firstName={player.first_name}
                    lastName={player.last_name}
                    avatarUrl={player.avatar_url}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span className="truncate">{player.first_name} {player.last_name}</span>
                      {player.isTrialist && <Badge variant="secondary" className="text-[10px] px-1 py-0">provinante</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{player.jersey_number ? `#${player.jersey_number}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveConvocati} 
                disabled={selectedPlayers.length === 0 || loading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : 'Salva Convocati'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista convocati */}
      {convocati.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista Convocati
            </CardTitle>
            <CardDescription>
              {isReadOnly 
                ? 'Giocatori convocati per questa sessione'
                : 'Giocatori selezionati come convocati'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {convocati.map((convocato) => {
                const player = convocato.players || getPlayerById((convocato.player_id || convocato.trialist_id) as string)
                if (!player) return null

                return (
                  <div
                    key={convocato.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <PlayerAvatar
                      firstName={player.first_name}
                      lastName={player.last_name}
                      avatarUrl={player.avatar_url}
                      size="md"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {player.first_name} {player.last_name}
                        </p>
                        {player.isTrialist && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">provinante</Badge>
                        )}
                        {player.jersey_number && (
                          <Badge variant="outline" className="text-xs">
                            #{player.jersey_number}
                          </Badge>
                        )}
                        {player.position && (
                          <Badge variant="secondary" className="text-xs">
                            {player.position}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!isReadOnly && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rimuovi convocato</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler rimuovere <strong>{player.first_name} {player.last_name}</strong> dai convocati?
                              <br />
                              Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => confirmRemoveConvocato(convocato.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Rimuovi
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {isReadOnly && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Convocato
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {convocati.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isReadOnly 
                ? 'Nessun giocatore in panchina per questa sessione'
                : 'Nessun giocatore selezionato. Seleziona i giocatori per la panchina sopra.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
