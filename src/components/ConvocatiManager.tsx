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
}

interface Attendance {
  id: string
  player_id: string
  status: 'pending' | 'present' | 'absent' | 'late' | 'excused'
}

interface Convocato {
  id: string
  session_id: string
  player_id: string
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
}

export const ConvocatiManager = ({ sessionId, allPlayers, attendance, playersInLineup = [], isReadOnly = false }: ConvocatiManagerProps) => {
  const [convocati, setConvocati] = useState<Convocato[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Filtra i giocatori escludendo quelli già nella formazione
  const availablePlayers = allPlayers.filter(player => !playersInLineup.includes(player.id))

  // Usa lo stesso criterio delle formazioni: solo giocatori presenti (e non nella formazione)
  const presentPlayers = availablePlayers.filter(player => {
    const playerAttendance = attendance?.find(a => a.player_id === player.id);
    return playerAttendance?.status === 'present';
  })

  // Carica i convocati esistenti
  useEffect(() => {
    loadConvocati()
  }, [sessionId])

  const loadConvocati = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      // Query diretta senza join per evitare problemi con i types
      const { data, error } = await supabase
        .from('training_convocati')
        .select('*')
        .eq('session_id', sessionId)

      if (error) throw error
      
      // Type assertion per gestire il tipo che arriva dal database
      const typedData = (data || []) as Convocato[]
      setConvocati(typedData)
      setSelectedPlayers(typedData.map(c => c.player_id) || [])
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

      // Poi inserisce i nuovi convocati (senza campo confirmed)
      if (selectedPlayers.length > 0) {
        const convocatiToInsert = selectedPlayers.map(playerId => ({
          session_id: sessionId,
          player_id: playerId
        }))

        const { error } = await supabase
          .from('training_convocati')
          .insert(convocatiToInsert)

        if (error) throw error
      }

      await loadConvocati()
      toast.success('Panchina salvata con successo')
    } catch (error) {
      console.error('Errore nel salvare la panchina:', error)
      toast.error('Errore nel salvare la panchina')
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
    const allPresentIds = presentPlayers.map(player => player.id)
    setSelectedPlayers(allPresentIds)
  }

  const deselectAllPlayers = () => {
    setSelectedPlayers([])
  }

  // Calcolo nuove statistiche richieste
  const titolariCount = playersInLineup.length
  const presentiCount = attendance?.filter(a => a.status === 'present').length || 0
  const eleggibiliCount = presentPlayers.length // presenti non titolari
  const convocatiCount = convocati.length
  const disponibiliNonSelezionati = Math.max(0, eleggibiliCount - convocatiCount)
  const indisponibiliCount = allPlayers.filter(player => {
    const playerAttendance = attendance?.find(a => a.player_id === player.id)
    return player.status !== 'active' || 
           playerAttendance?.status === 'absent' || 
           playerAttendance?.status === 'excused'
  }).length
  const senzaRispostaCount = allPlayers.filter(player => {
    const a = attendance?.find(x => x.player_id === player.id)
    return !a || a.status === 'pending'
  }).length
  const totaleConvocati = titolariCount + convocatiCount
  
  const allPresentSelected = presentPlayers.length > 0 && presentPlayers.every(player => selectedPlayers.includes(player.id))

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
                <p className="text-sm text-muted-foreground">Panchina</p>
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
        {titolariCount} titolari + {convocatiCount} panchina = {totaleConvocati} convocati totali
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
              Seleziona i presenti non titolari da aggiungere alla panchina
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Messaggio informativo sul filtro */}
            {presentPlayers.length === 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <p className="text-sm">Nessun presente disponibile per la panchina oltre ai titolari.</p>
                </div>
              </div>
            )}

            {/* Pulsanti di controllo selezione */}
            {presentPlayers.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={selectAllPresentPlayers}
                    disabled={allPresentSelected}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {allPresentSelected ? 'Tutti selezionati' : `Convoca tutti (${presentPlayers.length})`}
                  </Button>
                  {selectedPlayers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={deselectAllPlayers}
                      className="flex items-center gap-2"
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
              {presentPlayers.map((player) => (
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
                    <p className="text-sm font-medium truncate">
                      {player.first_name} {player.last_name}
                    </p>
                    {player.jersey_number && (
                      <p className="text-xs text-muted-foreground">
                        #{player.jersey_number} • {player.position}
                      </p>
                    )}
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
                {loading ? 'Salvando...' : 'Salva Panchina'}
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
              Lista Panchina
            </CardTitle>
            <CardDescription>
              {isReadOnly 
                ? 'Giocatori in panchina per questa sessione'
                : 'Giocatori selezionati per la panchina (oltre agli 11 titolari)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {convocati.map((convocato) => {
                const player = convocato.players || getPlayerById(convocato.player_id)
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
                            <AlertDialogTitle>Rimuovi dalla panchina</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler rimuovere <strong>{player.first_name} {player.last_name}</strong> dalla panchina?
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
                        In Panchina
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
