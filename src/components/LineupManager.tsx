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
import html2canvas from 'html2canvas'

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
  
  // Stati per la personalizzazione PNG - inizializzati dopo l'hook
  const [fieldLinesColor, setFieldLinesColor] = useState('#ffffff')
  const [fieldLinesThickness, setFieldLinesThickness] = useState(2)
  const [jerseyNumbersColor, setJerseyNumbersColor] = useState('#000000')
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
                          <div className="w-12 h-12 rounded-full border-3 border-dashed border-black bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors formation-position-empty">
                            <Users className="w-6 h-6 text-black/70" />
                          </div>
                        )}
                        <div className="text-xs text-white font-medium px-2 py-1 bg-black/50 rounded backdrop-blur-sm">
                          {position.role || position.name}
                          {position.roleShort && (
                            <div className="text-xs opacity-75">({position.roleShort})</div>
                          )}
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

        {/* Personalizzazione PNG */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Personalizzazione PNG</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Righe campo</label>
              <input 
                type="color" 
                className="w-full h-8 rounded border cursor-pointer"
                value={fieldLinesColor}
                onChange={(e) => setFieldLinesColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Numeri maglie</label>
              <input 
                type="color" 
                className="w-full h-8 rounded border cursor-pointer"
                value={jerseyNumbersColor}
                onChange={(e) => setJerseyNumbersColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Box nomi</label>
              <input 
                type="color" 
                className="w-full h-8 rounded border cursor-pointer"
                value={nameBoxColor}
                onChange={(e) => setNameBoxColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Testo nomi</label>
              <input 
                type="color" 
                className="w-full h-8 rounded border cursor-pointer"
                value={nameTextColor}
                onChange={(e) => setNameTextColor(e.target.value)}
              />
            </div>
          </div>
          
          {/* Spessore linee campo */}
          <div className="mt-4 pt-4 border-t">
            <label className="text-xs text-muted-foreground block mb-2">Spessore linee campo</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="8"
                value={fieldLinesThickness}
                onChange={(e) => setFieldLinesThickness(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium min-w-[2rem] text-center">
                {fieldLinesThickness}px
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Sottile</span>
              <span>Spesso</span>
            </div>
          </div>
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (defaultSetting) {
                  setFieldLinesColor(defaultSetting.field_lines_color)
                  setFieldLinesThickness(defaultSetting.field_lines_thickness)
                  setJerseyNumbersColor(defaultSetting.jersey_numbers_color)
                  setNameBoxColor(defaultSetting.name_box_color)
                  setNameTextColor(defaultSetting.name_text_color)
                }
              }}
            >
              Reset ai colori di default
            </Button>
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
          <Button 
            variant="outline" 
            onClick={downloadFormation} 
            disabled={exporting || Object.keys(playerPositions).length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Generando...' : 'Scarica PNG'}
          </Button>
        </div>
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