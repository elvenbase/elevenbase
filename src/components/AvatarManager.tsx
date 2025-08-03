import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Edit, Trash2, Upload, Palette, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAvatarBackgrounds, AvatarBackground } from '@/hooks/useAvatarBackgrounds'

export const AvatarManager: React.FC = () => {
  const { backgrounds, loading, createBackground, updateBackground, deleteBackground, setAsDefaultBackground, uploadImage } = useAvatarBackgrounds()
  const [editingBackground, setEditingBackground] = useState<AvatarBackground | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'color' as 'color' | 'image',
    value: '#3B82F6'
  })
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()



  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const imageUrl = await uploadImage(file)
      setFormData(prev => ({ ...prev, value: imageUrl }))
      toast({
        title: "Successo",
        description: "Immagine caricata con successo"
      })
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome è obbligatorio",
        variant: "destructive"
      })
      return
    }

    if (formData.type === 'color' && !formData.value) {
      toast({
        title: "Errore",
        description: "Il colore è obbligatorio",
        variant: "destructive"
      })
      return
    }

    if (formData.type === 'image' && !formData.value) {
      toast({
        title: "Errore",
        description: "L'immagine è obbligatoria",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingBackground) {
        await updateBackground(editingBackground.id, {
          name: formData.name,
          type: formData.type,
          value: formData.value
        })
        setEditingBackground(null)
      } else {
        await createBackground({
          name: formData.name,
          type: formData.type,
          value: formData.value,
          is_default: backgrounds.length === 0 // First one becomes default
        })
        setIsCreating(false)
      }

      setFormData({ name: '', type: 'color', value: '#3B82F6' })
    } catch (error) {
      console.error('Error saving background:', error)
    }
  }

  const handleDelete = async (background: AvatarBackground) => {
    try {
      await deleteBackground(background.id)
    } catch (error) {
      console.error('Error deleting background:', error)
    }
  }

  const setDefault = async (background: AvatarBackground) => {
    try {
      await setAsDefaultBackground(background.id)
    } catch (error) {
      console.error('Error setting default:', error)
    }
  }

  const handleEdit = (background: AvatarBackground) => {
    setEditingBackground(background)
    setFormData({
      name: background.name,
      type: background.type,
      value: background.value
    })
  }

  const handleCancel = () => {
    setEditingBackground(null)
    setIsCreating(false)
    setFormData({ name: '', type: 'color', value: '#3B82F6' })
  }



  if (isCreating || editingBackground) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {editingBackground ? 'Modifica Sfondo Avatar' : 'Nuovo Sfondo Avatar'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Es. Blu Squadra, Verde Campo, etc."
            />
          </div>

          <div>
            <Label>Tipo di Sfondo</Label>
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={formData.type === 'color' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, type: 'color', value: '#3B82F6' }))}
                className="flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Colore
              </Button>
              <Button
                type="button"
                variant={formData.type === 'image' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, type: 'image', value: '' }))}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Immagine
              </Button>
            </div>
          </div>

          {formData.type === 'color' ? (
            <div>
              <Label htmlFor="color">Colore</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Immagine di Sfondo</Label>
              <div className="mt-2 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.value && (
                  <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                    <img
                      src={formData.value}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={uploading}>
              {editingBackground ? 'Aggiorna' : 'Crea'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestione Sfondi Avatar</CardTitle>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Sfondo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessuno sfondo avatar configurato</p>
            <p className="text-sm">Crea il tuo primo sfondo personalizzato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backgrounds.map((background) => (
              <Card key={background.id} className="overflow-hidden">
                <div className="relative">
                  <div 
                    className="h-32 w-full"
                    style={{
                      backgroundColor: background.type === 'color' ? background.value : 'transparent',
                      backgroundImage: background.type === 'image' ? `url(${background.value})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  {background.is_default && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Predefinito
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{background.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(background)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Elimina Sfondo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare lo sfondo "{background.name}"?
                              Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(background)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefault(background)}
                      disabled={background.is_default}
                    >
                      Imposta Predefinito
                    </Button>
                  </div>

                  {/* Preview with avatar */}
                  <div className="mt-3 flex justify-center">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="" />
                      <AvatarFallback 
                        className="text-white font-bold"
                        style={{
                          backgroundColor: background.type === 'color' ? background.value : 'transparent',
                          backgroundImage: background.type === 'image' ? `url(${background.value})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        JD
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}