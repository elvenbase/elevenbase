import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Download, Users, Calendar, MapPin, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import FormationExporter from '../components/FormationExporter'
import JerseyImageUpload from '../components/JerseyImageUpload'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
}

interface LineupPlayer {
  player_id: string
  position_x: number
  position_y: number
  player?: Player
}

interface Formation {
  name: string
  positions: Array<{ x: number; y: number }>
}

interface Session {
  id: string
  created_at: string
  title: string
  description: string
  date: string
  time: string
  location: string
  team_name: string
  user_id: string
  formation_id: string
}

const PublicSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [formation, setFormation] = useState<Formation | null>(null)
  const [lineup, setLineup] = useState<LineupPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [jerseyImage, setJerseyImage] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      toast.error('Session ID mancante')
      return
    }

    const fetchSessionData = async () => {
      setLoading(true)
      try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) {
          console.error('Errore nel recupero della sessione:', sessionError)
          toast.error('Errore nel recupero della sessione')
          return
        }

        if (!sessionData) {
          toast.error('Sessione non trovata')
          navigate('/404')
          return
        }

        setSession(sessionData as Session)

        // Fetch formation
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('*')
          .eq('id', sessionData.formation_id)
          .single()

        if (formationError) {
          console.error('Errore nel recupero della formazione:', formationError)
          toast.error('Errore nel recupero della formazione')
          return
        }

        setFormation(formationData as Formation)

        // Fetch lineup
        const { data: lineupData, error: lineupError } = await supabase
          .from('lineups')
          .select('*, player:players(*)')
          .eq('session_id', sessionId)

        if (lineupError) {
          console.error('Errore nel recupero della lineup:', lineupError)
          toast.error('Errore nel recupero della lineup')
          return
        }

        setLineup(lineupData as LineupPlayer[])
      } catch (error) {
        console.error('Errore durante il recupero dei dati:', error)
        toast.error('Errore durante il recupero dei dati')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [sessionId, navigate])

  const handleDownloadPNG = async () => {
    if (lineup.length === 0) {
      toast.error('Aggiungi almeno un giocatore per scaricare la formazione')
      return
    }

    try {
      const element = document.getElementById('formation-export')
      if (!element) {
        toast.error('Impossibile trovare l\'elemento da scaricare')
        return
      }

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        logging: false,
      })

      const dataURL = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataURL
      link.download = `${session?.title || 'formazione'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Errore durante il download:', error)
      toast.error('Errore durante il download')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner text-blue-500"></span>
      </div>
    )
  }

  if (!session || !formation) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sessione non trovata</CardTitle>
          </CardHeader>
          <CardContent>
            <p>La sessione richiesta non è stata trovata.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{session.title}</h1>
          <p className="text-gray-600">Condividi questa pagina con la tua squadra!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dettagli Sessione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Data</p>
                  <p className="text-gray-600">
                    {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: it })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Ora</p>
                  <p className="text-gray-600">{session.time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Luogo</p>
                  <p className="text-gray-600">
                    <MapPin className="inline-block h-4 w-4 mr-1" />
                    {session.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Squadra</p>
                  <p className="text-gray-600">{session.team_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Descrizione</p>
                  <p className="text-gray-600">{session.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formation Display */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Formazione: {formation?.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadPNG}
                  className="flex items-center gap-2"
                  disabled={lineup.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Scarica PNG
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <JerseyImageUpload 
                  onImageUpload={setJerseyImage}
                  currentImage={jerseyImage}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {lineup.map((lineupPlayer) => (
                  <div key={lineupPlayer.player_id} className="flex items-center space-x-4">
                    <User className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{lineupPlayer.player?.first_name} {lineupPlayer.player?.last_name}</p>
                      <p className="text-xs text-gray-500">Posizione X: {lineupPlayer.position_x}, Y: {lineupPlayer.position_y}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden export component */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <FormationExporter
            lineup={lineup}
            formation={formation!}
            sessionTitle={session?.title || ''}
            teamName={session?.team_name || undefined}
            jerseyImage={jerseyImage}
          />
        </div>
      </div>
    </div>
  )
}

export default PublicSession
