import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trash2, Save, Users, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useLineupManager } from '@/hooks/useLineupManager'
import { useCustomFormations } from '@/hooks/useCustomFormations'
import FormationExporter from '@/components/FormationExporter'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import { usePngExportSettings } from '@/hooks/usePngExportSettings'
import { useAvatarColor } from '@/hooks/useAvatarColor'
import html2canvas from 'html2canvas'

// Stili CSS personalizzati per il range slider
const rangeSliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider:focus {
    outline: none;
  }
  
  .slider:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3);
  }
  
  .slider:focus::-moz-range-thumb {
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3);
  }
`

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
      { id: 'gk', name: 'Portiere', x: 50, y: 90, role: 'Portiere', roleShort: 'P' },
      { id: 'rb', name: 'Terzino Dx', x: 80, y: 70, role: 'Terzino Destro', roleShort: 'TD' },
      { id: 'cb1', name: 'Centrale 1', x: 60, y: 70, role: 'Difensore Centrale', roleShort: 'DC' },
      { id: 'cb2', name: 'Centrale 2', x: 40, y: 70, role: 'Difensore Centrale', roleShort: 'DC' },
      { id: 'lb', name: 'Terzino Sx', x: 20, y: 70, role: 'Terzino Sinistro', roleShort: 'TS' },
      { id: 'rm', name: 'Esterno Dx', x: 80, y: 40, role: 'Esterno Destro', roleShort: 'ED' },
      { id: 'cm1', name: 'Mediano 1', x: 60, y: 40, role: 'Mediano', roleShort: 'M' },
      { id: 'cm2', name: 'Mediano 2', x: 40, y: 40, role: 'Mediano', roleShort: 'M' },
      { id: 'lm', name: 'Esterno Sx', x: 20, y: 40, role: 'Esterno Sinistro', roleShort: 'ES' },
      { id: 'st1', name: 'Attaccante 1', x: 60, y: 15, role: 'Attaccante', roleShort: 'A' },
      { id: 'st2', name: 'Attaccante 2', x: 40, y: 15, role: 'Attaccante', roleShort: 'A' }
    ]
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 'gk', name: 'Portiere', x: 50, y: 90, role: 'Portiere', roleShort: 'P' },
      { id: 'rb', name: 'Terzino Dx', x: 80, y: 70, role: 'Terzino Destro', roleShort: 'TD' },
      { id: 'cb1', name: 'Centrale 1', x: 60, y: 70, role: 'Difensore Centrale', roleShort: 'DC' },
      { id: 'cb2', name: 'Centrale 2', x: 40, y: 70, role: 'Difensore Centrale', roleShort: 'DC' },
      { id: 'lb', name: 'Terzino Sx', x: 20, y: 70, role: 'Terzino Sinistro', roleShort: 'TS' },
      { id: 'cdm', name: 'Mediano', x: 50, y: 50, role: 'Mediano', roleShort: 'M' },
      { id: 'cm1', name: 'Mezzala Dx', x: 65, y: 40, role: 'Mezzala Destra', roleShort: 'MD' },
      { id: 'cm2', name: 'Mezzala Sx', x: 35, y: 40, role: 'Mezzala Sinistra', roleShort: 'MS' },
      { id: 'rw', name: 'Ala Dx', x: 80, y: 20, role: 'Ala Destra', roleShort: 'AD' },
      { id: 'st', name: 'Punta', x: 50, y: 15, role: 'Punta Centrale', roleShort: 'PC' },
      { id: 'lw', name: 'Ala Sx', x: 20, y: 20, role: 'Ala Sinistra', roleShort: 'AS' }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 'gk', name: 'Portiere', x: 50, y: 90, role: 'Portiere', roleShort: 'P' },
      { id: 'cb1', name: 'Centrale Dx', x: 70, y: 70, role: 'Difensore Centrale', roleShort: 'DC' },
      { id: 'cb2', name: 'Centrale', x: 50, y: 70, role: 'Libero', roleShort: 'L' },
      { id: 'cb3', name: 'Centrale Sx', x: 30, y: 70, role: 'Difensore Centrale', roleShort: 'DC' },
      { id: 'rwb', name: 'Quinto Dx', x: 85, y: 50, role: 'Quinto Destro', roleShort: 'QD' },
      { id: 'cm1', name: 'Mediano 1', x: 65, y: 40, role: 'Mediano', roleShort: 'M' },
      { id: 'cm2', name: 'Regista', x: 50, y: 45, role: 'Regista', roleShort: 'R' },
      { id: 'cm3', name: 'Mediano 2', x: 35, y: 40, role: 'Mediano', roleShort: 'M' },
      { id: 'lwb', name: 'Quinto Sx', x: 15, y: 50, role: 'Quinto Sinistro', roleShort: 'QS' },
      { id: 'st1', name: 'Attaccante 1', x: 60, y: 15, role: 'Attaccante', roleShort: 'A' },
      { id: 'st2', name: 'Attaccante 2', x: 40, y: 15, role: 'Attaccante', roleShort: 'A' }
    ]
  }
}

const LineupManager = ({ sessionId, presentPlayers }: LineupManagerProps) => {
  const [selectedFormation, setSelectedFormation] = useState<string>('4-4-2')
  const [playerPositions, setPlayerPositions] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState(false)
  
  // Inietta gli stili CSS personalizzati
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = rangeSliderStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])
  
  const { 
    lineup, 
    loading, 
    createLineup, 
    updateLineup,
    loadLineup 
  } = useLineupManager(sessionId)

  const { formations: customFormations } = useCustomFormations()
  const { defaultJersey } = useJerseyTemplates()
  const { defaultSetting } = usePngExportSettings()
  const { getAvatarBackground } = useAvatarColor()
  
  // Stati per la personalizzazione PNG - inizializzati dopo l'hook
  const [fieldLinesColor, setFieldLinesColor] = useState('#ffffff')
  const [fieldLinesThickness, setFieldLinesThickness] = useState(2)
  const [jerseyNumbersColor, setJerseyNumbersColor] = useState('#000000')
  const [jerseyNumbersShadow, setJerseyNumbersShadow] = useState('2px 2px 4px rgba(0,0,0,0.9)')
  const [usePlayerAvatars, setUsePlayerAvatars] = useState(false)
  const [nameBoxColor, setNameBoxColor] = useState('#ffffff')
  const [nameTextColor, setNameTextColor] = useState('#000000')

  // Carica formazione esistente quando cambia la sessione
  useEffect(() => {
    loadLineup()
  }, [sessionId])

  // Aggiorna colori quando cambiano le impostazioni PNG di default
  useEffect(() => {
    if (defaultSetting) {
      setFieldLinesColor(defaultSetting.field_lines_color)
      setFieldLinesThickness(defaultSetting.field_lines_thickness)
      setJerseyNumbersColor(defaultSetting.jersey_numbers_color)
      setJerseyNumbersShadow(defaultSetting.jersey_numbers_shadow)
      setUsePlayerAvatars(defaultSetting.use_player_avatars)
      setNameBoxColor(defaultSetting.name_box_color)
      setNameTextColor(defaultSetting.name_text_color)
    }
  }, [defaultSetting])

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
    const predefinedFormation = formations[selectedFormation as keyof typeof formations]
    if (predefinedFormation) {
      return predefinedFormation
    }
    
    // Fallback to default formation if nothing is found
    return formations['4-4-2']
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

  const downloadFormation = async () => {
    if (!lineup || Object.keys(playerPositions).length === 0) {
      toast.error('Nessuna formazione da esportare')
      return
    }

    setExporting(true)
    
    try {
      const exportElement = document.getElementById('formation-export-lineup')
      if (!exportElement) {
        toast.error('Errore nel preparare l\'immagine')
        return
      }

      toast.loading('Generando immagine...')
      
      // Forza il refresh dell'elemento
      exportElement.style.display = 'none'
      exportElement.offsetHeight // Trigger reflow
      exportElement.style.display = 'block'
      
      // Piccolo delay per assicurarsi che il DOM sia aggiornato
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(exportElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      // Create download link
      const link = document.createElement('a')
      const timestamp = new Date().getTime()
      link.download = `formazione-${currentFormation.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.dismiss()
      toast.success('Formazione scaricata con successo!')
    } catch (error) {
      console.error('Error downloading formation:', error)
      toast.dismiss()
      toast.error('Errore nel scaricare la formazione')
    } finally {
      setExporting(false)
    }
  }

  const currentFormation = getCurrentFormation()
  const assignedCount = Object.keys(playerPositions).length



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
        <div className="flex gap-2 sm:gap-4">
          <Badge variant="outline" className="text-xs sm:text-sm">
            <Users className="mr-1 h-3 w-3" />
            Presenti: {presentPlayers.length}
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            Assegnati: {assignedCount}/11
          </Badge>
        </div>

        {/* Campo da calcio con proporzioni realistiche */}
        {/* Mobile version (under 1100px) */}
        <div className="block xl:hidden w-full max-w-md mx-auto">
          <div 
            className="relative bg-gradient-to-b from-green-100 to-green-200 border-2 border-white rounded-lg shadow-lg overflow-hidden" 
            style={{ aspectRatio: '2/3', minHeight: '400px' }}
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
                            <Avatar 
                              className="w-10 h-10 border-2 border-white shadow-lg group-hover:scale-110 transition-transform"
                              style={getAvatarBackground(assignedPlayer.first_name + assignedPlayer.last_name)}
                            >
                              <AvatarImage src={assignedPlayer.avatar_url || undefined} />
                              <AvatarFallback 
                                className="text-white font-bold text-xs"
                              >
                                {getPlayerInitials(assignedPlayer)}
                              </AvatarFallback>
                            </Avatar>
                            {assignedPlayer.jersey_number && (
                              <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow">
                                {assignedPlayer.jersey_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full border-2 border-dashed border-black bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors formation-position-empty">
                            <Users className="w-5 h-5 text-black/70" />
                          </div>
                        )}
                        {/* Mobile: Mostra solo ruolo ridotto come badge minimo */}
                        <div className="text-xs text-white font-medium px-1.5 py-0.5 bg-black/60 rounded backdrop-blur-sm">
                          {position.roleShort || position.role?.substring(0, 3) || position.name.substring(0, 3)}
                        </div>
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
                                <Avatar 
                                  className="w-8 h-8"
                                  style={getAvatarBackground(player.first_name + player.last_name)}
                                >
                                  <AvatarImage src={player.avatar_url || undefined} />
                                  <AvatarFallback 
                                    className="text-white text-xs font-bold"
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
                          <Avatar 
                            className="w-10 h-10"
                            style={getAvatarBackground(assignedPlayer.first_name + assignedPlayer.last_name)}
                          >
                            <AvatarImage src={assignedPlayer.avatar_url || undefined} />
                            <AvatarFallback 
                              className="text-white font-bold"
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

        {/* Desktop version (1100px and above) */}
        <div className="hidden xl:block w-full max-w-6xl mx-auto">
          <div 
            className="relative bg-gradient-to-b from-green-100 to-green-200 border-4 border-white rounded-lg shadow-lg overflow-hidden" 
            style={{ aspectRatio: '2/3', minHeight: '800px' }}
          >
            {/* Desktop field content */}
            {/* Sfondo erba con pattern - desktop */}
            <div 
              className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,100,0,0.1) 15px, rgba(0,100,0,0.1) 30px)'
              }}
            />
            
            {/* Linee del campo - desktop */}
            <div className="absolute inset-0">
              {/* Bordo campo */}
              <div className="absolute inset-3 border-4 border-white rounded-sm" />
              
              {/* Area di rigore superiore */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-4 border-white" />
              {/* Area piccola superiore */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-4 border-white" />
              {/* Dischetto superiore */}
              <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
              
              {/* Linea di metà campo */}
              <div className="absolute top-1/2 left-3 right-3 border-t-4 border-white" />
              {/* Cerchio di centrocampo */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-white rounded-full"
                style={{ width: '25%', aspectRatio: '1' }}
              />
              {/* Punto del centrocampo */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
              
              {/* Area di rigore inferiore */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-2/5 h-1/6 border-4 border-white" />
              {/* Area piccola inferiore */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-1/4 h-[8%] border-4 border-white" />
              {/* Dischetto inferiore */}
              <div className="absolute bottom-[12%] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
              
              {/* Porte */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1.5 bg-white" />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1.5 bg-white" />
            </div>

            {/* Posizioni giocatori - desktop */}
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
                      <div className="flex flex-col items-center space-y-2">
                        {assignedPlayer ? (
                          <div className="relative">
                            <Avatar 
                              className="w-16 h-16 border-3 border-white shadow-lg group-hover:scale-110 transition-transform"
                              style={getAvatarBackground(assignedPlayer.first_name + assignedPlayer.last_name)}
                            >
                              <AvatarImage src={assignedPlayer.avatar_url || undefined} />
                              <AvatarFallback 
                                className="text-white font-bold text-lg"
                              >
                                {getPlayerInitials(assignedPlayer)}
                              </AvatarFallback>
                            </Avatar>
                            {assignedPlayer.jersey_number && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                {assignedPlayer.jersey_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-white/80 border-3 border-dashed border-gray-400 rounded-full flex items-center justify-center group-hover:bg-white transition-colors shadow-lg">
                            <span className="text-gray-600 text-sm font-medium">
                              {position.roleShort || position.role?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-sm font-medium text-gray-800 bg-white/90 px-2 py-1 rounded-lg shadow-sm">
                          {assignedPlayer ? `${assignedPlayer.first_name} ${assignedPlayer.last_name}` : position.name}
                        </div>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <div className="font-semibold text-primary">{position.name}</div>
                      <Select 
                        value={playerPositions[position.id] || ''} 
                        onValueChange={(playerId) => handlePlayerAssignment(position.id, playerId)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona giocatore" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nessun giocatore</SelectItem>
                                                     {getAvailablePlayers(position.id).map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  className="w-8 h-8"
                                  style={getAvatarBackground(player.first_name + player.last_name)}
                                >
                                  <AvatarImage src={player.avatar_url || undefined} />
                                  <AvatarFallback 
                                    className="text-white text-xs font-bold"
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
                          <Avatar 
                            className="w-10 h-10"
                            style={getAvatarBackground(assignedPlayer.first_name + assignedPlayer.last_name)}
                          >
                            <AvatarImage src={assignedPlayer.avatar_url || undefined} />
                            <AvatarFallback 
                              className="text-white font-bold"
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

        {/* Azioni formazione */}
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

        {/* Personalizza export di questa formazione */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Personalizza export PNG
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configura l'aspetto del PNG della formazione prima di scaricarlo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
            {/* Colori */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm font-medium text-primary">Colori</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Righe campo</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      className="w-full h-8 sm:h-10 rounded-lg border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                      value={fieldLinesColor}
                      onChange={(e) => setFieldLinesColor(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground min-w-[3rem] hidden sm:block">
                      {fieldLinesColor}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Numeri maglie</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      className="w-full h-8 sm:h-10 rounded-lg border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                      value={jerseyNumbersColor}
                      onChange={(e) => setJerseyNumbersColor(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground min-w-[3rem] hidden sm:block">
                      {jerseyNumbersColor}
                    </div>
                  </div>
                </div>
                                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Ombra numeri</label>
                    <Select 
                      value={jerseyNumbersShadow}
                      onValueChange={setJerseyNumbersShadow}
                    >
                      <SelectTrigger className="w-full h-8 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2px 2px 4px rgba(0,0,0,0.9)">Ombra scura (default)</SelectItem>
                        <SelectItem value="2px 2px 4px rgba(255,255,255,0.9)">Ombra chiara</SelectItem>
                        <SelectItem value="1px 1px 2px rgba(0,0,0,0.8)">Ombra sottile</SelectItem>
                        <SelectItem value="3px 3px 6px rgba(0,0,0,0.9)">Ombra spessa</SelectItem>
                        <SelectItem value="none">Nessuna ombra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Utilizza avatar giocatori</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="use_avatars_lineup"
                        checked={usePlayerAvatars}
                        onChange={(e) => setUsePlayerAvatars(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="use_avatars_lineup" className="text-xs text-muted-foreground">
                        Mostra avatar invece delle maglie
                      </label>
                    </div>
                  </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Box nomi</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      className="w-full h-8 sm:h-10 rounded-lg border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                      value={nameBoxColor}
                      onChange={(e) => setNameBoxColor(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground min-w-[3rem] hidden sm:block">
                      {nameBoxColor}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Testo nomi</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      className="w-full h-8 sm:h-10 rounded-lg border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                      value={nameTextColor}
                      onChange={(e) => setNameTextColor(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground min-w-[3rem] hidden sm:block">
                      {nameTextColor}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spessore linee campo */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-primary">Spessore linee campo</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={fieldLinesThickness}
                    onChange={(e) => setFieldLinesThickness(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(fieldLinesThickness - 1) / 7 * 100}%, hsl(var(--primary) / 0.2) ${(fieldLinesThickness - 1) / 7 * 100}%, hsl(var(--primary) / 0.2) 100%)`
                    }}
                  />
                  <div className="flex items-center gap-2 min-w-[4rem]">
                    <span className="text-sm font-bold text-primary">
                      {fieldLinesThickness}px
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Sottile</span>
                  <span>Spesso</span>
                </div>
              </div>
            </div>

            {/* Azioni export */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-primary/20">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                if (defaultSetting) {
                  setFieldLinesColor(defaultSetting.field_lines_color)
                  setFieldLinesThickness(defaultSetting.field_lines_thickness)
                  setJerseyNumbersColor(defaultSetting.jersey_numbers_color)
                  setJerseyNumbersShadow(defaultSetting.jersey_numbers_shadow)
                  setUsePlayerAvatars(defaultSetting.use_player_avatars)
                  setNameBoxColor(defaultSetting.name_box_color)
                  setNameTextColor(defaultSetting.name_text_color)
                }
              }}
                className="text-primary hover:text-primary/80 text-xs sm:text-sm"
              >
                Reset ai colori di default
              </Button>
              <Button 
                onClick={downloadFormation} 
                disabled={exporting || Object.keys(playerPositions).length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base"
              >
                <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {exporting ? 'Generando PNG...' : 'Scarica PNG'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>

      {/* Hidden Formation Exporter for PNG generation */}
      {lineup && Object.keys(playerPositions).length > 0 && defaultJersey && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
          <div id="formation-export-lineup">
            <FormationExporter
              lineup={currentFormation.positions.map(position => ({
                player_id: playerPositions[position.id] || '',
                position_x: position.x,
                position_y: position.y,
                player: playerPositions[position.id] ? presentPlayers.find(p => p.id === playerPositions[position.id]) : undefined
              })).filter(item => item.player)}
              formation={{
                name: currentFormation.name,
                positions: currentFormation.positions.map(pos => ({ x: pos.x, y: pos.y }))
              }}
              sessionTitle="Sessione di allenamento"
              teamName="Team"
              jerseyUrl={defaultJersey.image_url}
              fieldLinesColor={fieldLinesColor}
              fieldLinesThickness={fieldLinesThickness}
              jerseyNumbersColor={jerseyNumbersColor}
              jerseyNumbersShadow={jerseyNumbersShadow}
              usePlayerAvatars={usePlayerAvatars}
              nameBoxColor={nameBoxColor}
              nameTextColor={nameTextColor}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

export default LineupManager