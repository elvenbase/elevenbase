import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Users, Download } from 'lucide-react'
import { useCustomFormations, CustomFormation } from '@/hooks/useCustomFormations'
import { FormationBuilder } from '@/components/FormationBuilder'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { JerseyManager } from '@/components/JerseyManager'
import FormationExporter from '@/components/FormationExporter'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

export default function Formations() {
  const { formations, loading, createFormation, updateFormation, deleteFormation } = useCustomFormations()
  const { defaultJersey } = useJerseyTemplates()
  const [editingFormation, setEditingFormation] = useState<CustomFormation | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [exportingFormation, setExportingFormation] = useState<string | null>(null)

  const handleSave = async (formationData: Omit<CustomFormation, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      if (editingFormation) {
        await updateFormation(editingFormation.id, formationData)
        setEditingFormation(null)
      } else {
        await createFormation(formationData)
        setIsCreating(false)
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleCancel = () => {
    setEditingFormation(null)
    setIsCreating(false)
  }

  // Giocatori di esempio per l'esportazione
  const getSamplePlayers = (formation: CustomFormation) => {
    const samplePlayers = [
      { id: '1', first_name: 'Marco', last_name: 'Rossi', jersey_number: 1 },
      { id: '2', first_name: 'Luca', last_name: 'Bianchi', jersey_number: 2 },
      { id: '3', first_name: 'Giuseppe', last_name: 'Verdi', jersey_number: 3 },
      { id: '4', first_name: 'Antonio', last_name: 'Neri', jersey_number: 4 },
      { id: '5', first_name: 'Roberto', last_name: 'Gialli', jersey_number: 5 },
      { id: '6', first_name: 'Paolo', last_name: 'Blu', jersey_number: 6 },
      { id: '7', first_name: 'Carlo', last_name: 'Rosa', jersey_number: 7 },
      { id: '8', first_name: 'Mario', last_name: 'Arancio', jersey_number: 8 },
      { id: '9', first_name: 'Franco', last_name: 'Viola', jersey_number: 9 },
      { id: '10', first_name: 'Alberto', last_name: 'Grigio', jersey_number: 10 },
      { id: '11', first_name: 'Davide', last_name: 'Marrone', jersey_number: 11 }
    ]
    
    return formation.positions.slice(0, 11).map((position, index) => ({
      player_id: samplePlayers[index]?.id || `player-${index}`,
      position_x: position.x,
      position_y: position.y,
      player: samplePlayers[index] || { id: `player-${index}`, first_name: 'Giocatore', last_name: `${index + 1}`, jersey_number: index + 1 }
    }))
  }

  const downloadFormation = async (formation: CustomFormation) => {
    setExportingFormation(formation.id)
    
    try {
      const exportElement = document.getElementById(`formation-export-${formation.id}`)
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
      link.download = `formazione-${formation.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.dismiss()
      toast.success('Formazione scaricata con successo!')
    } catch (error) {
      console.error('Error downloading formation:', error)
      toast.dismiss()
      toast.error('Errore nel scaricare la formazione')
    } finally {
      setExportingFormation(null)
    }
  }

  const FormationPreview: React.FC<{ formation: CustomFormation }> = ({ formation }) => (
    <div className="relative w-full aspect-[2/3] bg-green-500 rounded-lg overflow-hidden border-2 border-white">
      {/* Field markings */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 w-12 h-12 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white transform -translate-y-1/2" />
        <div className="absolute left-1/4 right-1/4 top-0 h-8 border-b border-l border-r border-white" />
        <div className="absolute left-1/4 right-1/4 bottom-0 h-8 border-t border-l border-r border-white" />
      </div>

      {/* Positions */}
      {formation.positions.map((position) => (
        <div
          key={position.id}
          className="absolute w-4 h-4 bg-blue-600 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`
          }}
          title={position.role || position.name}
        />
      ))}
    </div>
  )

  if (isCreating || editingFormation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FormationBuilder
          formation={editingFormation || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestione Formazioni</h1>
          <p className="text-muted-foreground mt-2">
            Crea e gestisci le formazioni personalizzate per la tua squadra
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova Formazione
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="aspect-[2/3] bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : formations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna formazione</h3>
            <p className="text-muted-foreground mb-4">
              Inizia creando la tua prima formazione personalizzata
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crea Prima Formazione
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <Card key={formation.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{formation.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formation.defenders}-{formation.midfielders}-{formation.forwards}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFormation(formation)}
                      disabled={exportingFormation === formation.id}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingFormation(formation)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Elimina Formazione</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare la formazione "{formation.name}"? 
                            Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFormation(formation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormationPreview formation={formation} />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Totale giocatori: {formation.positions.length}</p>
                  <p>Creata: {new Date(formation.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Gestione Maglie */}
      <JerseyManager />

      {/* Hidden Formation Exporters for PNG generation */}
      {formations.map((formation) => (
        <div key={`export-${formation.id}`} style={{ position: 'absolute', left: '-9999px', top: '0' }}>
          <div id={`formation-export-${formation.id}`}>
            <FormationExporter
              lineup={getSamplePlayers(formation)}
              formation={{
                name: formation.name,
                positions: formation.positions.map(pos => ({ x: pos.x, y: pos.y }))
              }}
              sessionTitle="Sessione di allenamento"
              teamName="Team"
              jerseyUrl={defaultJersey?.image_url}
            />
          </div>
        </div>
      ))}
    </div>
  )
}