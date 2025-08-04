import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Users, UserCheck, UserX, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAvatarColor } from '@/hooks/useAvatarColor'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
  avatar_url?: string
}

interface Convocato {
  id: string
  session_id: string
  player_id: string
  confirmed: boolean
  notes?: string
  created_at: string
  players?: Player
}

interface ConvocatiManagerProps {
  sessionId: string
  allPlayers: Player[]
  isReadOnly?: boolean
}

export const ConvocatiManager = ({ sessionId, allPlayers, isReadOnly = false }: ConvocatiManagerProps) => {
  const [convocati, setConvocati] = useState<Convocato[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const { getAvatarBackground } = useAvatarColor()

  // Carica i convocati esistenti
  useEffect(() => {
    loadConvocati()
  }, [sessionId])

  const loadConvocati = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('training_convocati')
        .select(`
          *,
          players (
            id,
            first_name,
            last_name,
            jersey_number,
            position,
            avatar_url
          )
        `)
        .eq('session_id', sessionId)

      if (error) throw error
      
      setConvocati(data || [])
      setSelectedPlayers(data?.map(c => c.player_id) || [])
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

      // Poi inserisce i nuovi convocati
      if (selectedPlayers.length > 0) {
        const convocatiToInsert = selectedPlayers.map(playerId => ({
          session_id: sessionId,
          player_id: playerId,
          confirmed: false
        }))

        const { error } = await supabase
          .from('training_convocati')
          .insert(convocatiToInsert)

        if (error) throw error
      }

      await loadConvocati()
      toast.success('Convocati salvati con successo')
    } catch (error) {
      console.error('Errore nel salvare i convocati:', error)
      toast.error('Errore nel salvare i convocati')
    } finally {
      setLoading(false)
    }
  }

  const toggleConfirmation = async (convocatoId: string, confirmed: boolean) => {
    if (isReadOnly) return

    try {
      const { error } = await supabase
        .from('training_convocati')
        .update({ confirmed: !confirmed })
        .eq('id', convocatoId)

      if (error) throw error

      setConvocati(prev => 
        prev.map(c => 
          c.id === convocatoId 
            ? { ...c, confirmed: !confirmed }
            : c
        )
      )

      toast.success(confirmed ? 'Conferma rimossa' : 'Presenza confermata')
    } catch (error) {
      console.error('Errore nell\'aggiornare la conferma:', error)
      toast.error('Errore nell\'aggiornare la conferma')
    }
  }

  const getPlayerById = (playerId: string) => {
    return allPlayers.find(p => p.id === playerId)
  }

  const confirmedCount = convocati.filter(c => c.confirmed).length
  const totalConvocati = convocati.length

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalConvocati}</p>
                <p className="text-sm text-muted-foreground">Convocati</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
                <p className="text-sm text-muted-foreground">Confermati</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{totalConvocati - confirmedCount}</p>
                <p className="text-sm text-muted-foreground">In attesa</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              Seleziona i giocatori da convocare per questa sessione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {allPlayers.map((player) => (
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={player.avatar_url || undefined} />
                    <AvatarFallback 
                      className="text-xs"
                      style={getAvatarBackground(player.first_name + player.last_name)}
                    >
                      {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
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
                disabled={loading}
                className="flex items-center gap-2"
              >
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
                : 'Gestisci le conferme dei convocati'
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
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      convocato.confirmed
                        ? 'border-green-200 bg-green-50'
                        : 'border-border'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.avatar_url || undefined} />
                      <AvatarFallback 
                        style={getAvatarBackground(player.first_name + player.last_name)}
                      >
                        {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
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
                      <Button
                        variant={convocato.confirmed ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleConfirmation(convocato.id, convocato.confirmed)}
                        className="flex items-center gap-2"
                      >
                        {convocato.confirmed ? (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Confermato
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4" />
                            Conferma
                          </>
                        )}
                      </Button>
                    )}

                    {isReadOnly && (
                      <Badge 
                        variant={convocato.confirmed ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {convocato.confirmed ? (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Confermato
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" />
                            In attesa
                          </>
                        )}
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
                ? 'Nessun giocatore convocato per questa sessione'
                : 'Nessun giocatore selezionato. Seleziona i convocati sopra.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}