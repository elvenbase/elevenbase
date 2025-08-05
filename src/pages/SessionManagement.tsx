
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Calendar, Clock, MapPin, Users, Target, ArrowLeft, Settings, Share, Download } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useTrainingSessions, useTrainingAttendance, usePlayers } from '@/hooks/useSupabaseData'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import { usePngExportSettings } from '@/hooks/usePngExportSettings'
import { useLineupManager } from '@/hooks/useLineupManager'
import { AttendanceForm } from '@/components/forms/AttendanceForm'
import { TrainingForm } from '@/components/forms/TrainingForm'
import LineupManager from '@/components/LineupManager'
import { ConvocatiManager } from '@/components/ConvocatiManager'
import PublicLinkSharing from '@/components/PublicLinkSharing'
import FormationExporter from '@/components/FormationExporter'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

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

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  communication_type?: 'party' | 'discord' | 'altro' | null;
  communication_details?: string;
  max_participants?: number;
  is_closed: boolean;
  public_link_token?: string;
  allow_responses_until?: string;
}

const SessionManagement = () => {
  const { id: sessionId } = useParams<{ id: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [playersInLineup, setPlayersInLineup] = useState<string[]>([])
  
  const { data: sessions, isLoading: loadingSessions } = useTrainingSessions()
  const { data: attendance, isLoading: loadingAttendance } = useTrainingAttendance(sessionId!)
  const { data: players } = usePlayers()
  
  // Hook per PNG export
  const { defaultJersey } = useJerseyTemplates()
  const { defaultSetting } = usePngExportSettings()
  const { lineup: lineupData } = useLineupManager(sessionId!)
  
  // Stati per la personalizzazione PNG
  const [fieldLinesColor, setFieldLinesColor] = useState('#ffffff')
  const [fieldLinesThickness, setFieldLinesThickness] = useState(2)
  const [jerseyNumbersColor, setJerseyNumbersColor] = useState('#000000')
  const [jerseyNumbersShadow, setJerseyNumbersShadow] = useState('2px 2px 4px rgba(0,0,0,0.9)')
  const [usePlayerAvatars, setUsePlayerAvatars] = useState(false)
  const [nameBoxColor, setNameBoxColor] = useState('#ffffff')
  const [nameTextColor, setNameTextColor] = useState('#000000')
  const [exporting, setExporting] = useState(false)

  const session = sessions?.find(s => s.id === sessionId) as TrainingSession | undefined

  // Controlla se c'è una formazione salvata con giocatori
  const savedPlayersInFormation = lineupData?.players_data?.positions ? 
    Object.values(lineupData.players_data.positions).filter(playerId => playerId && playerId !== 'none').length 
    : 0
  const hasSavedFormation = lineupData && savedPlayersInFormation > 0
  // Fallback: mostra se ha 11 giocatori selezionati o formazione salvata
  const shouldShowPngExport = hasSavedFormation || playersInLineup.length === 11

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(date + 'T' + time)
    return format(sessionDate, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })
  }

  const getStatusBadge = (session: TrainingSession) => {
    if (session.is_closed) {
      return <Badge variant="secondary">Chiusa</Badge>
    }
    
    const now = new Date()
    const sessionDate = new Date(session.session_date + 'T' + session.start_time)
    
    if (sessionDate < now) {
      return <Badge variant="outline">Passata</Badge>
    }
    
    return <Badge variant="default">Programmata</Badge>
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleLineupChange = useCallback((playerIds: string[]) => {
    setPlayersInLineup(playerIds)
  }, [])

  // Aggiorna impostazioni PNG dal defaultSetting
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

  useEffect(() => {
    if (lineupData?.players_data?.formation_data) {
      const formationData = lineupData.players_data.formation_data
      setFieldLinesColor(formationData.field_lines_color || '#ffffff')
      setFieldLinesThickness(formationData.field_lines_thickness || 2)
      setJerseyNumbersColor(formationData.jersey_numbers_color || '#000000')
      setJerseyNumbersShadow(formationData.jersey_numbers_shadow || '2px 2px 4px rgba(0,0,0,0.9)')
      setUsePlayerAvatars(formationData.use_player_avatars || false)
      setNameBoxColor(formationData.name_box_color || '#ffffff')
      setNameTextColor(formationData.name_text_color || '#000000')
    }
  }, [lineupData])

  const resetToDefault = () => {
    setFieldLinesColor('#ffffff')
    setFieldLinesThickness(2)
    setJerseyNumbersColor('#000000')
    setJerseyNumbersShadow('2px 2px 4px rgba(0,0,0,0.9)')
    setUsePlayerAvatars(false)
    setNameBoxColor('#ffffff')
    setNameTextColor('#000000')
    toast.success('Colori ripristinati ai valori di default')
  }

  const downloadFormation = async () => {
    if (!hasSavedFormation && playersInLineup.length < 11) {
      toast.error('Seleziona 11 giocatori o salva una formazione per esportare')
      return
    }

    setExporting(true)
    try {
      const element = document.getElementById('formation-export')
      if (!element) {
        toast.error('Elemento di export non trovato')
        return
      }

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false
      })

      const link = document.createElement('a')
      const formationName = lineupData?.formation || '4-4-2-auto'
      link.download = `formazione-${formationName}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL()
      link.click()

      toast.success('Formazione esportata con successo!')
    } catch (error) {
      console.error('Errore nell\'esportazione:', error)
      toast.error('Errore nell\'esportazione della formazione')
    } finally {
      setExporting(false)
    }
  }

  // Calcola statistiche presenze
  const attendanceStats = {
    present: attendance?.filter(a => a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.status === 'absent').length || 0,
    noResponse: (players?.length || 0) - (attendance?.length || 0),
    totalPlayers: players?.length || 0
  }

  if (loadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Caricamento sessione...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/training" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="border-b bg-card rounded-lg mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-3 sm:py-6">
          {/* Mobile layout - stacked */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/training">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna agli Allenamenti
                </Link>
              </Button>
              <TrainingForm 
                session={session} 
                mode="edit"
              >
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              </TrainingForm>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold">{session.title}</h1>
                {getStatusBadge(session)}
              </div>
              {session.description && (
                <p className="text-sm text-muted-foreground">{session.description}</p>
              )}
            </div>
          </div>

          {/* Desktop layout - horizontal */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/training">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna agli Allenamenti
                </Link>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{session.title}</h1>
                  {getStatusBadge(session)}
                </div>
                <p className="text-muted-foreground">{session.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrainingForm 
                session={session} 
                mode="edit"
              >
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Modifica Sessione
                </Button>
              </TrainingForm>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Data e Ora</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDateTime(session.session_date, session.start_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Durata</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.start_time} - {session.end_time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(session.communication_type || session.location) && (
            <Card>
              <CardContent className="p-3 sm:pt-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium">Comunicazioni</p>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        // Usa i nuovi campi strutturati se disponibili
                        if (session.communication_type) {
                          const type = session.communication_type.charAt(0).toUpperCase() + session.communication_type.slice(1);
                          if (session.communication_type === 'discord' && session.communication_details) {
                            return (
                              <div className="space-y-1">
                                <div>{type}</div>
                                <a 
                                  href={session.communication_details} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline truncate block"
                                >
                                  {session.communication_details}
                                </a>
                              </div>
                            );
                          } else if (session.communication_type === 'altro' && session.communication_details) {
                            return <span className="truncate">{session.communication_details}</span>;
                          }
                          return <span>{type}</span>;
                        }
                        // Fallback per retrocompatibilità
                        return <span className="truncate">{session.location || 'Non specificato'}</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Presenze</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {attendanceStats.present} presenti, {attendanceStats.absent} assenti
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Presenze
            </TabsTrigger>
            <TabsTrigger value="lineup" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Formazione
            </TabsTrigger>
            <TabsTrigger value="public-link" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Link Pubblico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestione Presenze
                </CardTitle>
                <CardDescription>
                  Gestisci le presenze dei giocatori per questa sessione di allenamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionId && (
                  <AttendanceForm 
                    sessionId={sessionId}
                    sessionTitle={session.title}
                    key={refreshKey}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineup" className="space-y-6">
            {/* Formazione */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Formazione
                </CardTitle>
                <CardDescription>
                  Imposta la formazione per questa sessione di allenamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionId && (
                  <LineupManager 
                    sessionId={sessionId} 
                    key={`lineup-${refreshKey}`} 
                    presentPlayers={players?.filter(player => {
                      const playerAttendance = attendance?.find(a => a.player_id === player.id);
                      return playerAttendance?.status === 'present';
                    }) || []}
                    onLineupChange={handleLineupChange}
                  />
                )}
                
                {/* Panchina - appare solo con formazione completa */}
                {sessionId && players && playersInLineup.length === 11 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Panchina
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gestisci i giocatori in panchina per questa sessione di allenamento
                      </p>
                    </div>
                    <ConvocatiManager 
                      sessionId={sessionId}
                      allPlayers={players}
                      attendance={attendance}
                      playersInLineup={playersInLineup}
                      key={`convocati-${refreshKey}`}
                    />
                  </div>
                )}
                
                {/* Messaggio quando formazione non è completa */}
                {playersInLineup.length < 11 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Completa la formazione</h3>
                      <p className="text-muted-foreground">
                        Seleziona tutti gli 11 titolari ({playersInLineup.length}/11) per accedere alla gestione della panchina
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Formazione - Sezione separata per creativi */}
            {sessionId && shouldShowPngExport && (
              <Card className="border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Download className="h-5 w-5" />
                    Export Creativo - PNG Formazione
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Strumenti per grafici e social media manager - Personalizza e scarica la formazione in PNG
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-amber-800 mb-2">
                      💡 <strong>Questa sezione è dedicata al team creativo</strong> per la pubblicazione sui social e materiali grafici.
                    </p>
                    <p className="text-xs text-amber-700">
                      L'allenatore può concentrarsi sulla gestione della formazione e panchina sopra, mentre qui il team creativo può personalizzare l'export per le pubblicazioni.
                    </p>
                  </div>
                  
                  {/* Personalizzazione Export PNG */}
                  <div className="space-y-4">
                    <style>{rangeSliderStyles}</style>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                      {/* Colore righe campo */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-amber-800">Righe campo</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            className="w-full h-8 sm:h-10 rounded-lg border-2 border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                            value={fieldLinesColor}
                            onChange={(e) => setFieldLinesColor(e.target.value)}
                          />
                          <div className="text-xs text-amber-700 min-w-[3rem] hidden sm:block">
                            {fieldLinesColor}
                          </div>
                        </div>
                      </div>

                      {/* Colore numeri maglie */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-amber-800">Numeri maglie</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            className="w-full h-8 sm:h-10 rounded-lg border-2 border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                            value={jerseyNumbersColor}
                            onChange={(e) => setJerseyNumbersColor(e.target.value)}
                          />
                          <div className="text-xs text-amber-700 min-w-[3rem] hidden sm:block">
                            {jerseyNumbersColor}
                          </div>
                        </div>
                      </div>

                      {/* Ombra numeri */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-amber-800">Ombra numeri</label>
                        <Select 
                          value={jerseyNumbersShadow}
                          onValueChange={setJerseyNumbersShadow}
                        >
                          <SelectTrigger className="w-full h-8 sm:h-10 border-amber-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessuna</SelectItem>
                            <SelectItem value="1px 1px 2px rgba(0,0,0,0.5)">Leggera</SelectItem>
                            <SelectItem value="2px 2px 4px rgba(0,0,0,0.7)">Media</SelectItem>
                            <SelectItem value="2px 2px 4px rgba(0,0,0,0.9)">Forte</SelectItem>
                            <SelectItem value="3px 3px 6px rgba(0,0,0,1)">Molto forte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Avatar giocatori */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-amber-800">Utilizza avatar giocatori</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="use_avatars_export"
                            checked={usePlayerAvatars}
                            onChange={(e) => setUsePlayerAvatars(e.target.checked)}
                            className="rounded border-amber-300"
                          />
                          <label htmlFor="use_avatars_export" className="text-xs text-amber-700">
                            Mostra avatar invece delle maglie
                          </label>
                        </div>
                      </div>

                      {/* Colore box nomi */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-amber-800">Box nomi</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            className="w-full h-8 sm:h-10 rounded-lg border-2 border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                            value={nameBoxColor}
                            onChange={(e) => setNameBoxColor(e.target.value)}
                          />
                          <div className="text-xs text-amber-700 min-w-[3rem] hidden sm:block">
                            {nameBoxColor}
                          </div>
                        </div>
                      </div>

                      {/* Colore testo nomi */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-amber-800">Testo nomi</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            className="w-full h-8 sm:h-10 rounded-lg border-2 border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                            value={nameTextColor}
                            onChange={(e) => setNameTextColor(e.target.value)}
                          />
                          <div className="text-xs text-amber-700 min-w-[3rem] hidden sm:block">
                            {nameTextColor}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spessore righe - slider separato */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-amber-800">Spessore righe campo</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={fieldLinesThickness}
                            onChange={(e) => setFieldLinesThickness(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, rgb(251 191 36) 0%, rgb(251 191 36) ${(fieldLinesThickness - 1) / 7 * 100}%, rgb(251 191 36 / 0.3) ${(fieldLinesThickness - 1) / 7 * 100}%, rgb(251 191 36 / 0.3) 100%)`
                            }}
                          />
                          <div className="flex items-center gap-2 min-w-[4rem]">
                            <span className="text-sm font-bold text-amber-800">
                              {fieldLinesThickness}px
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-amber-600 px-1">
                          <span>Sottile</span>
                          <span>Spesso</span>
                        </div>
                      </div>
                    </div>

                    {/* Azioni export */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-200">
                      <Button 
                        variant="outline" 
                        onClick={resetToDefault}
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 text-xs sm:text-sm"
                      >
                        Reset ai colori di default
                      </Button>
                                             <Button 
                         onClick={downloadFormation} 
                         disabled={exporting || (!hasSavedFormation && playersInLineup.length < 11)}
                         className="bg-amber-600 hover:bg-amber-700 text-white text-sm sm:text-base"
                       >
                        <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {exporting ? 'Generando PNG...' : 'Scarica PNG'}
                      </Button>
                    </div>

                    {/* FormationExporter nascosto per il rendering */}
                    <div className="hidden">
                      <FormationExporter
                        id="formation-export"
                        lineup={(() => {
                          // Se c'è formazione salvata, usa quella
                          if (lineupData && players) {
                            return Object.entries(lineupData.players_data?.positions || {})
                              .filter(([_, playerId]) => playerId && playerId !== 'none')
                              .map(([positionId, playerId]) => {
                                const player = players.find(p => p.id === playerId)
                                return player ? {
                                  player_id: playerId,
                                  position_x: 50,
                                  position_y: 50,
                                  player: player
                                } : null
                              })
                              .filter(Boolean) as any[]
                          }
                          
                          // Se non c'è formazione salvata ma ci sono giocatori selezionati, usa quelli
                          if (players && playersInLineup.length > 0) {
                            // Posizioni per formazione 4-4-2 di default
                            const defaultPositions = [
                              // Portiere
                              { x: 50, y: 85 },
                              // Difensori (4)
                              { x: 20, y: 70 }, { x: 40, y: 70 }, { x: 60, y: 70 }, { x: 80, y: 70 },
                              // Centrocampisti (4) 
                              { x: 20, y: 45 }, { x: 40, y: 45 }, { x: 60, y: 45 }, { x: 80, y: 45 },
                              // Attaccanti (2)
                              { x: 35, y: 20 }, { x: 65, y: 20 }
                            ]
                            
                            return playersInLineup.map((playerId, index) => {
                              const player = players.find(p => p.id === playerId)
                              const position = defaultPositions[index] || { x: 50, y: 50 } // Fallback al centro
                              return player ? {
                                player_id: playerId,
                                position_x: position.x,
                                position_y: position.y,
                                player: player
                              } : null
                            }).filter(Boolean) as any[]
                          }
                          
                          return []
                        })()}
                        formation={{
                          name: lineupData?.formation || '4-4-2 (Auto)',
                          positions: []
                        }}
                        sessionTitle="Sessione di allenamento"
                        teamName="Team"
                        jerseyUrl={defaultJersey?.image_url}
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="public-link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-5 w-5" />
                  Link Pubblico per Registrazioni
                </CardTitle>
                <CardDescription>
                  Condividi il link pubblico per permettere ai giocatori di registrare la loro presenza
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublicLinkSharing 
                  session={session} 
                  attendanceStats={attendanceStats}
                  onRefresh={handleRefresh}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}

export default SessionManagement
