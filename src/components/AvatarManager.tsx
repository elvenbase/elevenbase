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
    value: '#3B82F6',
    text_color: '#ffffff',
    text_shadow: '2px 2px 4px rgba(0,0,0,0.8)',
    text_size: '14px',
    text_weight: '600',
    text_family: 'Inter, system-ui, sans-serif'
  })
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const [defaultAvatarUrl, setDefaultAvatarUrl] = useState('')

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

  const handleDefaultAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const url = await uploadImage(file)
      setDefaultAvatarUrl(url)
      toast({ title: 'Avatar Persona di default caricato', description: 'Salvato come elemento "default-avatar".' })
      // Per compatibilità usiamo nome convenzionale
      const existing = backgrounds.find(b => b.type==='image' && (b.name||'').toLowerCase()==='default-avatar')
      if (existing) {
        await updateBackground(existing.id, { value: url, type: 'image' })
      } else {
        await createBackground({ name: 'default-avatar', type: 'image', value: url, is_default: false, text_color: '#ffffff', text_shadow: '2px 2px 4px rgba(0,0,0,0.8)', text_size: '14px', text_weight: '600', text_family: 'Inter, system-ui, sans-serif' })
      }
    } catch (err) {
      toast({ title: 'Errore', description: 'Impossibile caricare', variant: 'destructive' })
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
          value: formData.value,
          text_color: formData.text_color,
          text_shadow: formData.text_shadow,
          text_size: formData.text_size,
          text_weight: formData.text_weight,
          text_family: formData.text_family
        })
        setEditingBackground(null)
      } else {
        await createBackground({
          name: formData.name,
          type: formData.type,
          value: formData.value,
          text_color: formData.text_color,
          text_shadow: formData.text_shadow,
          text_size: formData.text_size,
          text_weight: formData.text_weight,
          text_family: formData.text_family,
          is_default: backgrounds.length === 0
        })
        setIsCreating(false)
      }

      setFormData({ 
        name: '', 
        type: 'color', 
        value: '#3B82F6',
        text_color: '#ffffff',
        text_shadow: '2px 2px 4px rgba(0,0,0,0.8)',
        text_size: '14px',
        text_weight: '600',
        text_family: 'Inter, system-ui, sans-serif'
      })
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
      value: background.value,
      text_color: background.text_color || '#ffffff',
      text_shadow: background.text_shadow || '2px 2px 4px rgba(0,0,0,0.8)',
      text_size: background.text_size || '14px',
      text_weight: background.text_weight || '600',
      text_family: background.text_family || 'Inter, system-ui, sans-serif'
    })
  }

  const handleCancel = () => {
    setEditingBackground(null)
    setIsCreating(false)
    setFormData({ 
      name: '', 
      type: 'color', 
      value: '#3B82F6',
      text_color: '#ffffff',
      text_shadow: '2px 2px 4px rgba(0,0,0,0.8)',
      text_size: '14px',
      text_weight: '600',
      text_family: 'Inter, system-ui, sans-serif'
    })
  }



  if (isCreating || editingBackground) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {editingBackground ? 'Modifica Avatar Background' : 'Nuovo Elemento Avatar'}
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
            <Label>Tipo</Label>
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={formData.type === 'color' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, type: 'color', value: '#3B82F6' }))}
                className="flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Avatar Background (colore)
              </Button>
              <Button
                type="button"
                variant={formData.type === 'image' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, type: 'image', value: '' }))}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Avatar Persona (immagine)
              </Button>
            </div>
          </div>

          {formData.type === 'color' ? (
            <div>
              <Label htmlFor="color">Colore (Avatar Background)</Label>
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
              <Label>Immagine (Avatar Persona)</Label>
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

          {/* Text Settings Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Impostazioni Scritte</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="text_color">Colore Testo</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="text_size">Dimensione Testo</Label>
                <select
                  id="text_size"
                  value={formData.text_size}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_size: e.target.value }))}
                  className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                >
                  <option value="12px">Piccolo (12px)</option>
                  <option value="14px">Normale (14px)</option>
                  <option value="16px">Grande (16px)</option>
                  <option value="18px">Molto Grande (18px)</option>
                  <option value="20px">Enorme (20px)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="text_weight">Spessore Testo</Label>
                <select
                  id="text_weight"
                  value={formData.text_weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_weight: e.target.value }))}
                  className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                >
                  <option value="400">Normale (400)</option>
                  <option value="500">Medio (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra Bold (800)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="text_shadow">Ombra Testo</Label>
                <select
                  id="text_shadow"
                  value={formData.text_shadow}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_shadow: e.target.value }))}
                  className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                >
                  <option value="none">Nessuna</option>
                  <option value="1px 1px 2px rgba(0,0,0,0.5)">Leggera</option>
                  <option value="2px 2px 4px rgba(0,0,0,0.8)">Media</option>
                  <option value="3px 3px 6px rgba(0,0,0,0.9)">Forte</option>
                  <option value="0 0 10px rgba(255,255,255,0.8)">Glow Bianco</option>
                  <option value="0 0 10px rgba(0,0,0,0.8)">Glow Nero</option>
                </select>
              </div>
            </div>

            {/* Text Preview */}
            <div className="mt-4 p-3 border rounded-lg">
              <Label className="text-sm text-gray-600 mb-2">Anteprima Testo</Label>
              <div 
                className="p-3 rounded"
                style={{
                  backgroundColor: formData.type === 'color' ? formData.value : '#3B82F6',
                  backgroundImage: formData.type === 'image' && formData.value ? `url(${formData.value})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div
                  style={{
                    color: formData.text_color,
                    fontSize: formData.text_size,
                    fontWeight: formData.text_weight,
                    fontFamily: formData.text_family,
                    textShadow: formData.text_shadow,
                    textAlign: 'center'
                  }}
                >
                  Esempio Testo
                </div>
              </div>
            </div>
          </div>

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
          <CardTitle>Avatar Persona & Avatar Background</CardTitle>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Elemento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Caricamento…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backgrounds.map((bg) => (
              <div key={bg.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{bg.name || (bg.type === 'image' ? 'Avatar Persona' : 'Avatar Background')}</div>
                  {bg.is_default && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {bg.type === 'image' ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border">
                      <img src={bg.value} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full border" style={{ backgroundColor: bg.value }} />
                  )}
                  <div className="text-sm text-muted-foreground">
                    {bg.type === 'image' ? 'Avatar Persona' : 'Avatar Background'}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(bg)}>
                    <Edit className="w-4 h-4 mr-1" /> Modifica
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setDefault(bg)}>
                    Default
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(bg)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Elimina
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 border-t pt-4">
          <div className="font-semibold mb-2">Imposta Avatar Persona di Default</div>
          <Input type="file" accept="image/*" onChange={handleDefaultAvatarUpload} />
          {defaultAvatarUrl && (
            <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border">
              <img src={defaultAvatarUrl} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}