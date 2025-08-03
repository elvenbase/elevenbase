
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Upload, X } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { toast } from 'sonner'

interface JerseyImageUploadProps {
  onImageUpload: (imageUrl: string | null) => void
  currentImage?: string | null
}

const JerseyImageUpload = ({ onImageUpload, currentImage }: JerseyImageUploadProps) => {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Si prega di selezionare un file immagine')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 5MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `jersey_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('jersey-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('jersey-images')
        .getPublicUrl(fileName)

      onImageUpload(publicUrl)
      toast.success('Immagine caricata con successo!')
    } catch (error) {
      console.error('Error uploading jersey image:', error)
      toast.error('Errore nel caricamento dell\'immagine')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onImageUpload(null)
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="jersey-upload">Immagine Maglietta Personalizzata</Label>
      
      {currentImage ? (
        <div className="relative inline-block">
          <img 
            src={currentImage} 
            alt="Jersey preview" 
            className="w-20 h-20 object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            id="jersey-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('jersey-upload')?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Caricamento...' : 'Carica Immagine'}
          </Button>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Carica un'immagine personalizzata per le magliette. Formati supportati: JPG, PNG, WebP (max 5MB)
      </p>
    </div>
  )
}

export default JerseyImageUpload
