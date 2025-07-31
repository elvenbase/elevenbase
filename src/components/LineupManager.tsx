import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useLineupManager } from '@/hooks/useLineupManager'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
}

interface LineupManagerProps {
  sessionId: string
  presentPlayers: Player[]
}

const formations = {
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 'gk', name: 'Portiere', x: 50, y: 90 },
      { id: 'rb', name: 'Terzino Dx', x: 80, y: 70 },
      { id: 'cb1', name: 'Centrale 1', x: 60, y: 70 },
      { id: 'cb2', name: 'Centrale 2', x: 40, y: 70 },
      { id: 'lb', name: 'Terzino Sx', x: 20, y: 70 },
      { id: 'rm', name: 'Esterno Dx', x: 80, y: 40 },
      { id: 'cm1', name: 'Mediano 1', x: 60, y: 40 },
      { id: 'cm2', name: 'Mediano 2', x: 40, y: 40 },
      { id: 'lm', name: 'Esterno Sx', x: 20, y: 40 },
      { id: 'st1', name: 'Attaccante 1', x: 60, y: 15 },
      { id: 'st2', name: 'Attaccante 2', x: 40, y: 15 }
    ]
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 'gk', name: 'Portiere', x: 50, y: 90 },
      { id: 'rb', name: 'Terzino Dx', x: 80, y: 70 },
      { id: 'cb1', name: 'Centrale 1', x: 60, y: 70 },
      { id: 'cb2', name: 'Centrale 2', x: 40, y: 70 },
      { id: 'lb', name: 'Terzino Sx', x: 20, y: 70 },
      { id: 'cdm', name: 'Mediano', x: 50, y: 50 },
      { id: 'cm1', name: 'Mezzala Dx', x: 65, y: 40 },
      { id: 'cm2', name: 'Mezzala Sx', x: 35, y: 40 },
      { id: 'rw', name: 'Ala Dx', x: 80, y: 20 },
      { id: 'st', name: 'Punta', x: 50, y: 15 },
      { id: 'lw', name: 'Ala Sx', x: 20, y: 20 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 'gk', name: 'Portiere', x: 50, y: 90 },
      { id: 'cb1', name: 'Centrale Dx', x: 70, y: 70 },
      { id: 'cb2', name: 'Centrale', x: 50, y: 70 },
      { id: 'cb3', name: 'Centrale Sx', x: 30, y: 70 },
      { id: 'rwb', name: 'Quinto Dx', x: 85, y: 50 },
      { id: 'cm1', name: 'Mediano 1', x: 65, y: 40 },
      { id: 'cm2', name: 'Regista', x: 50, y: 45 },
      { id: 'cm3', name: 'Mediano 2', x: 35, y: 40 },
      { id: 'lwb', name: 'Quinto Sx', x: 15, y: 50 },
      { id: 'st1', name: 'Attaccante 1', x: 60, y: 15 },
      { id: 'st2', name: 'Attaccante 2', x: 40, y: 15 }
    ]
  }
}

const LineupManager = ({ sessionId, presentPlayers }: LineupManagerProps) => {
  const [selectedFormation, setSelectedFormation] = useState<string>('4-4-2')
  const [playerPositions, setPlayerPositions] = useState<Record<string, string>>({})
  
  const { 
    lineup, 
    loading, 
    createLineup, 
    updateLineup,
    loadLineup 
  } = useLineupManager(sessionId)

  // Carica formazione esistente quando cambia la sessione
  useEffect(() => {
    loadLineup()
  }, [sessionId])

  // Aggiorna stato locale quando viene caricata la formazione
  useEffect(() => {
    if (lineup) {
      setSelectedFormation(lineup.formation)
      setPlayerPositions(lineup.players_data?.positions || {})
    }
  }, [lineup])

  const handleFormationChange = (formation: string) => {
    setSelectedFormation(formation)
    // Reset posizioni quando cambia formazione
    setPlayerPositions({})
  }

  const handlePlayerAssignment = (positionId: string, playerId: string) => {
    setPlayerPositions(prev => {
      const newPositions = { ...prev }
      
      // Rimuovi il giocatore dalla posizione precedente se ne aveva una
      Object.keys(newPositions).forEach(key => {
        if (newPositions[key] === playerId) {
          delete newPositions[key]
        }
      })
      
      // Assegna alla nuova posizione (se non è vuoto)
      if (playerId) {
        newPositions[positionId] = playerId
      } else {
        delete newPositions[positionId]
      }
      
      return newPositions
    })
  }

  const getPlayerById = (playerId: string) => {
    return presentPlayers.find(p => p.id === playerId)
  }

  const getAvailablePlayers = (currentPositionId: string) => {
    const assignedPlayerIds = new Set(Object.values(playerPositions))
    const currentPlayer = playerPositions[currentPositionId]
    
    return presentPlayers.filter(p => 
      !assignedPlayerIds.has(p.id) || p.id === currentPlayer
    )
  }

  const handleSave = async () => {
    try {
      const lineupData = {
        formation: selectedFormation,
        players_data: {
          positions: playerPositions,
          formation_data: formations[selectedFormation as keyof typeof formations]
        }
      }

      if (lineup) {
        await updateLineup(lineupData)
      } else {
        await createLineup(lineupData)
      }
      
      toast.success('Formazione salvata con successo!')
    } catch (error) {
      console.error('Errore nel salvare la formazione:', error)
      toast.error('Errore nel salvare la formazione')
    }
  }

  const handleClear = () => {
    setPlayerPositions({})
  }

  const currentFormation = formations[selectedFormation as keyof typeof formations]
  const assignedCount = Object.keys(playerPositions).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Formazione</CardTitle>
        <CardDescription>
          Configura la formazione per questa sessione di allenamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selezione formazione */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Formazione</label>
          <Select value={selectedFormation} onValueChange={handleFormationChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(formations).map(([key, formation]) => (
                <SelectItem key={key} value={key}>
                  {formation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statistiche */}
        <div className="flex gap-4">
          <Badge variant="outline">
            Giocatori presenti: {presentPlayers.length}
          </Badge>
          <Badge variant="outline">
            Assegnati: {assignedCount}/11
          </Badge>
        </div>

        {/* Campo da calcio */}
        <div className="relative bg-green-100 border-2 border-green-600 rounded-lg" 
             style={{ aspectRatio: '1/1.5', minHeight: '400px' }}>
          {/* Linee del campo */}
          <div className="absolute inset-0">
            {/* Area di rigore superiore */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/6 border-2 border-green-600 bg-green-200/50"></div>
            {/* Area piccola superiore */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/5 h-1/12 border-2 border-green-600 bg-green-300/50"></div>
            
            {/* Linea di metà campo */}
            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-green-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 border-2 border-green-600 rounded-full bg-green-200/30"></div>
            
            {/* Area di rigore inferiore */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/6 border-2 border-green-600 bg-green-200/50"></div>
            {/* Area piccola inferiore */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/5 h-1/12 border-2 border-green-600 bg-green-300/50"></div>
          </div>

          {/* Posizioni giocatori */}
          {currentFormation.positions.map(position => {
            const assignedPlayer = playerPositions[position.id] ? getPlayerById(playerPositions[position.id]) : null
            
            return (
              <div
                key={position.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${position.x}%`, 
                  top: `${position.y}%` 
                }}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    assignedPlayer 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background border-border'
                  }`}>
                    {assignedPlayer?.jersey_number || '?'}
                  </div>
                  <div className="text-xs text-center font-medium min-w-20">
                    {position.name}
                  </div>
                  {assignedPlayer && (
                    <div className="text-xs text-center text-muted-foreground">
                      {assignedPlayer.first_name} {assignedPlayer.last_name}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Assegnazione giocatori */}
        <div className="space-y-4">
          <h4 className="font-medium">Assegna Giocatori</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFormation.positions.map(position => (
              <div key={position.id} className="space-y-2">
                <label className="text-sm font-medium">{position.name}</label>
                <Select 
                  value={playerPositions[position.id] || ''} 
                  onValueChange={(value) => handlePlayerAssignment(position.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona giocatore" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessun giocatore</SelectItem>
                    {getAvailablePlayers(position.id).map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        <div className="flex items-center gap-2">
                          {player.first_name} {player.last_name}
                          {player.jersey_number && (
                            <Badge variant="outline">#{player.jersey_number}</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Salva Formazione
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Cancella Tutto
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default LineupManager