import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trash2, Save, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useLineupManager } from '@/hooks/useLineupManager'
import { useCustomFormations } from '@/hooks/useCustomFormations'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
  avatar_url?: string
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

  const { formations: customFormations } = useCustomFormations()

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

  const getCurrentFormation = () => {
    // Check if it's a custom formation
    const customFormation = customFormations.find(f => f.id === selectedFormation)
    if (customFormation) {
      return {
        name: customFormation.name,
        positions: customFormation.positions
      }
    }
    
    // Use predefined formations
    return formations[selectedFormation as keyof typeof formations]
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
      
      // Assegna alla nuova posizione (se non è vuoto o "none")
      if (playerId && playerId !== 'none') {
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

  const currentFormation = getCurrentFormation()
  const assignedCount = Object.keys(playerPositions).length

  // Funzione per generare colori avatar basati sulle iniziali
  const getAvatarColor = (name: string) => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))', 
      'hsl(var(--accent))',
      'hsl(210, 100%, 60%)',
      'hsl(330, 80%, 60%)',
      'hsl(120, 70%, 50%)',
      'hsl(30, 90%, 60%)',
      'hsl(270, 70%, 60%)'
    ]
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Funzione per ottenere iniziali del giocatore
  const getPlayerInitials = (player: Player) => {
    return `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`.toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Formazione</CardTitle>
        <CardDescription>
          Clicca su una posizione nel campo per assegnare un giocatore
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
              {customFormations.length > 0 && (
                <>
                  {customFormations.map((formation) => (
                    <SelectItem key={formation.id} value={formation.id}>
                      {formation.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Statistiche */}
        <div className="flex gap-4">
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            Presenti: {presentPlayers.length}
          </Badge>
          <Badge variant="outline">
            Assegnati: {assignedCount}/11
          </Badge>
        </div>

        {/* Campo da calcio con proporzioni realistiche */}
        <div className="w-full max-w-2xl mx-auto">
          <div 
            className="relative bg-gradient-to-b from-green-100 to-green-200 border-4 border-white rounded-lg shadow-lg overflow-hidden" 
            style={{ aspectRatio: '2/3', minHeight: '500px' }}
          >
            {/* Sfondo erba con pattern */}
            <div 
              className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,100,0,0.1) 10px, rgba(0,100,0,0.1) 20px)'
              }}
            />
            
            {/* Linee del campo */}
            <div className="absolute inset-0">
              {/* Bordo campo */}
              <div className="absolute inset-2 border-2 border-white rounded-sm" />
              
              {/* Area di rigore superiore */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-2 border-white" />
              {/* Area piccola superiore */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-2 border-white" />
              {/* Dischetto superiore */}
              <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              
              {/* Linea di metà campo */}
              <div className="absolute top-1/2 left-2 right-2 border-t-2 border-white" />
              {/* Cerchio di centrocampo */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full"
                style={{ width: '25%', aspectRatio: '1' }}
              />
              {/* Punto del centrocampo */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
              
              {/* Area di rigore inferiore */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-2 border-white" />
              {/* Area piccola inferiore */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-2 border-white" />
              {/* Dischetto inferiore */}
              <div className="absolute bottom-[12%] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              
              {/* Porte */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1 bg-white" />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1 bg-white" />
            </div>

            {/* Posizioni giocatori */}
            {currentFormation.positions.map(position => {
              const assignedPlayer = playerPositions[position.id] ? getPlayerById(playerPositions[position.id]) : null
              
              return (
                <Popover key={position.id}>
                  <PopoverTrigger asChild>
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ 
                        left: `${position.x}%`, 
                        top: `${position.y}%` 
                      }}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        {assignedPlayer ? (
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-3 border-white shadow-lg group-hover:scale-110 transition-transform">
                              <AvatarImage src={assignedPlayer.avatar_url || undefined} />
                              <AvatarFallback 
                                className="text-white font-bold text-sm"
                                style={{ backgroundColor: getAvatarColor(assignedPlayer.first_name + assignedPlayer.last_name) }}
                              >
                                {getPlayerInitials(assignedPlayer)}
                              </AvatarFallback>
                            </Avatar>
                            {assignedPlayer.jersey_number && (
                              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow">
                                {assignedPlayer.jersey_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border-3 border-dashed border-white bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                            <Users className="w-6 h-6 text-white/70" />
                          </div>
                        )}
                        <div className="text-xs text-white font-medium px-2 py-1 bg-black/50 rounded backdrop-blur-sm">
                          {position.name}
                        </div>
                        {assignedPlayer && (
                          <div className="text-xs text-white/90 text-center px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm max-w-24 truncate">
                            {assignedPlayer.first_name} {assignedPlayer.last_name.charAt(0)}.
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-3">
                      <div className="font-semibold text-center">{position.name}</div>
                      <Select 
                        value={playerPositions[position.id] || ''} 
                        onValueChange={(value) => handlePlayerAssignment(position.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona giocatore" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Rimuovi giocatore</SelectItem>
                          {getAvailablePlayers(position.id).map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={player.avatar_url || undefined} />
                                  <AvatarFallback 
                                    className="text-white text-xs font-bold"
                                    style={{ backgroundColor: getAvatarColor(player.first_name + player.last_name) }}
                                  >
                                    {getPlayerInitials(player)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">{player.first_name} {player.last_name}</span>
                                  {player.position && (
                                    <span className="text-xs text-muted-foreground">{player.position}</span>
                                  )}
                                </div>
                                {player.jersey_number && (
                                  <Badge variant="outline" className="ml-auto">
                                    #{player.jersey_number}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assignedPlayer && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={assignedPlayer.avatar_url || undefined} />
                            <AvatarFallback 
                              className="text-white font-bold"
                              style={{ backgroundColor: getAvatarColor(assignedPlayer.first_name + assignedPlayer.last_name) }}
                            >
                              {getPlayerInitials(assignedPlayer)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{assignedPlayer.first_name} {assignedPlayer.last_name}</div>
                            {assignedPlayer.position && (
                              <div className="text-sm text-muted-foreground">{assignedPlayer.position}</div>
                            )}
                          </div>
                          {assignedPlayer.jersey_number && (
                            <Badge variant="secondary">#{assignedPlayer.jersey_number}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })}
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