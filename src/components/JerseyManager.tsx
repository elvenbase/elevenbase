import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Trash2, Star, Plus, Loader2 } from 'lucide-react'
import { useJerseyTemplates, JerseyTemplate } from '@/hooks/useJerseyTemplates'

export const JerseyManager = () => {
  const { 
    jerseyTemplates, 
    defaultJersey, 
    loading, 
    tableExists,
    createJerseyTemplate, 
    deleteJerseyTemplate, 
    uploadJerseyImage, 
    setAsDefault 
  } = useJerseyTemplates()

  // Debug info
  console.log('🎨 JerseyManager render:', {
    tableExists,
    loading,
    jerseyTemplatesCount: jerseyTemplates.length,
    defaultJersey: defaultJersey?.name,
    jerseyTemplates: jerseyTemplates.map(j => ({ id: j.id, name: j.name, is_default: j.is_default }))
  })

  // Debug visibile
  if (loading) {
    console.log('⏳ JerseyManager: Loading...')
  } else if (!tableExists) {
    console.log('❌ JerseyManager: Table does not exist')
  } else {
    console.log(`✅ JerseyManager: Table exists, found ${jerseyTemplates.length} jerseys`)
  }

  const [isCreating, setIsCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      const imageUrl = await uploadJerseyImage(selectedFile)
      setFormData(prev => ({ ...prev, image_url: imageUrl }))
    } catch (error) {
      console.error('Errore nell\'upload:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.image_url) return

    try {
      await createJerseyTemplate({
        name: formData.name,
        description: formData.description || undefined,
        image_url: formData.image_url
      })
      
      // Reset form
      setFormData({ name: '', description: '', image_url: '' })
      setSelectedFile(null)
      setPreviewUrl('')
      setIsCreating(false)
    } catch (error) {
      console.error('Errore nella creazione:', error)
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', description: '', image_url: '' })
    setSelectedFile(null)
    setPreviewUrl('')
    setIsCreating(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Gestione Maglie
          </CardTitle>
          {tableExists && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Maglia
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuova Maglia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Maglia</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="es. Maglia Home, Maglia Trasferta..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrizione (opzionale)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrizione della maglia..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Immagine Maglia</Label>
                  <div className="space-y-3">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    
                    {selectedFile && (
                      <div className="flex items-center gap-3">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded border"
                          />
                        )}
                        <Button
                          type="button"
                          onClick={handleUpload}
                          disabled={uploading || !!formData.image_url}
                          variant="outline"
                          size="sm"
                        >
                          {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {formData.image_url ? 'Caricata' : 'Carica'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={!formData.name || !formData.image_url}
                    className="flex-1"
                  >
                    Crea Maglia
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Annulla
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Debug info visibile */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Table exists: {tableExists ? '✅ Yes' : '❌ No'}</p>
          <p>Loading: {loading ? '⏳ Yes' : '✅ No'}</p>
          <p>Jerseys found: {jerseyTemplates.length}</p>
          <p>Default jersey: {defaultJersey?.name || 'None'}</p>
        </div>

        {!tableExists ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Funzionalità in arrivo!</p>
            <p className="text-sm">Il sistema di gestione maglie personalizzate sarà disponibile presto.</p>
            <p className="text-sm mt-2">Per ora viene utilizzata la maglia di default.</p>
          </div>
        ) : jerseyTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna maglia personalizzata caricata.</p>
            <p className="text-sm">Clicca su "Nuova Maglia" per creare la tua prima maglia personalizzata.</p>
            {defaultJersey && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Maglia di sistema attiva:</p>
                <p className="text-xs text-muted-foreground">{defaultJersey.name}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Le tue maglie personalizzate</h3>
              <p className="text-sm text-muted-foreground">
                {jerseyTemplates.length} maglia{jerseyTemplates.length !== 1 ? 'e' : ''} caricata{jerseyTemplates.length !== 1 ? 'e' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jerseyTemplates.map((jersey) => (
              <div key={jersey.id} className="relative group">
                <Card className={`transition-all ${jersey.is_default ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={jersey.image_url}
                        alt={jersey.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/lovable-uploads/jersey-example.png'
                        }}
                      />
                      {jersey.is_default && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium truncate">{jersey.name}</h4>
                      {jersey.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {jersey.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {!jersey.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAsDefault(jersey.id)}
                          className="flex-1"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Imposta Default
                        </Button>
                      )}
                      
                      {!jersey.is_default && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler eliminare la maglia "{jersey.name}"? 
                                Questa azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteJerseyTemplate(jersey.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}