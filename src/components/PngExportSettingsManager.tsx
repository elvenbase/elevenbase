import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Star, Loader2, Palette } from 'lucide-react'
import { usePngExportSettings, PngExportSetting } from '@/hooks/usePngExportSettings'

export const PngExportSettingsManager = () => {
  const { 
    settings, 
    defaultSetting, 
    loading, 
    tableExists,
    createSetting, 
    deleteSetting, 
    setAsDefault
  } = usePngExportSettings()

  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    field_lines_color: '#ffffff',
    jersey_numbers_color: '#000000',
    name_box_color: '#ffffff',
    name_text_color: '#000000',
    is_default: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    try {
      await createSetting({
        name: formData.name,
        description: formData.description || undefined,
        field_lines_color: formData.field_lines_color,
        jersey_numbers_color: formData.jersey_numbers_color,
        name_box_color: formData.name_box_color,
        name_text_color: formData.name_text_color,
        is_default: formData.is_default
      })
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        field_lines_color: '#ffffff',
        jersey_numbers_color: '#000000',
        name_box_color: '#ffffff',
        name_text_color: '#000000',
        is_default: false
      })
      setIsCreating(false)
    } catch (error) {
      console.error('Errore nella creazione:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      field_lines_color: '#ffffff',
      jersey_numbers_color: '#000000',
      name_box_color: '#ffffff',
      name_text_color: '#000000',
      is_default: false
    })
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
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Impostazioni PNG
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestisci le impostazioni di personalizzazione per l'esportazione PNG delle formazioni
            </p>
          </div>
          {tableExists && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Impostazione
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuova Impostazione PNG</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Impostazione</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="es. Default, Scuro, Chiaro..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrizione (opzionale)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrizione dell'impostazione..."
                      rows={2}
                    />
                  </div>

                  {/* Colori PNG */}
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Colori PNG</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Configura i colori per l'esportazione PNG
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Righe campo</Label>
                        <input 
                          type="color" 
                          className="w-full h-8 rounded border cursor-pointer"
                          value={formData.field_lines_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, field_lines_color: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Numeri maglie</Label>
                        <input 
                          type="color" 
                          className="w-full h-8 rounded border cursor-pointer"
                          value={formData.jersey_numbers_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, jersey_numbers_color: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Box nomi</Label>
                        <input 
                          type="color" 
                          className="w-full h-8 rounded border cursor-pointer"
                          value={formData.name_box_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_box_color: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Testo nomi</Label>
                        <input 
                          type="color" 
                          className="w-full h-8 rounded border cursor-pointer"
                          value={formData.name_text_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_text_color: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    />
                    <Label htmlFor="is_default" className="text-sm">
                      Imposta come default
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={!formData.name}
                      className="flex-1"
                    >
                      Crea Impostazione
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
        {!tableExists ? (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Funzionalità in arrivo!</p>
            <p className="text-sm">Il sistema di personalizzazione PNG sarà disponibile presto.</p>
            <p className="text-sm mt-2">Per ora vengono utilizzate le impostazioni di default.</p>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna impostazione personalizzata creata.</p>
            <p className="text-sm">Clicca su "Nuova Impostazione" per creare la tua prima configurazione PNG.</p>
            {defaultSetting && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Impostazioni di sistema attive:</p>
                <p className="text-xs text-muted-foreground">{defaultSetting.name}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{setting.name}</span>
                      {setting.is_default && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: setting.field_lines_color }}
                        />
                        <span className="text-xs text-muted-foreground">Righe</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: setting.jersey_numbers_color }}
                        />
                        <span className="text-xs text-muted-foreground">Numeri</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: setting.name_box_color }}
                        />
                        <span className="text-xs text-muted-foreground">Box</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: setting.name_text_color }}
                        />
                        <span className="text-xs text-muted-foreground">Testo</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {!setting.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAsDefault(setting.id)}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Elimina Impostazione</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sei sicuro di voler eliminare l'impostazione "{setting.name}"? 
                          Questa azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSetting(setting.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}