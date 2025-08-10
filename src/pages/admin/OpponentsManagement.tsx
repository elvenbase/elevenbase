import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useOpponents, useCreateOpponent, useUpdateOpponent, useDeleteOpponent } from '@/hooks/useSupabaseData'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Image as ImageIcon, Shirt } from 'lucide-react'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'

type JerseyShape = 'classic' | 'stripes' | 'hoops'

const JerseyMini = ({ shape, primary, secondary, accent, imageUrl }: { shape?: JerseyShape|null; primary?: string|null; secondary?: string|null; accent?: string|null; imageUrl?: string|null }) => {
  if (imageUrl) {
    return <img src={imageUrl} alt="jersey" className="h-6 w-6 rounded object-cover" />
  }
  const p = primary || '#008080'
  const s = secondary || '#ffffff'
  const style: React.CSSProperties = {}
  if (shape === 'stripes') {
    style.backgroundImage = `repeating-linear-gradient(90deg, ${p} 0 6px, ${s} 6px 12px)`
  } else if (shape === 'hoops') {
    style.backgroundImage = `repeating-linear-gradient(0deg, ${p} 0 6px, ${s} 6px 12px)`
  } else {
    style.backgroundColor = p
  }
  return <div className="h-6 w-6 rounded border" style={style} />
}

const OpponentsManagement = () => {
  const { data: opponents = [] } = useOpponents()
  const createOpponent = useCreateOpponent()
  const updateOpponent = useUpdateOpponent()
  const deleteOpponent = useDeleteOpponent()
  const { data: jerseys = [] } = useJerseyTemplates()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [creatingShape, setCreatingShape] = useState<JerseyShape>('classic')
  const [creatingPrimary, setCreatingPrimary] = useState('#008080')
  const [creatingSecondary, setCreatingSecondary] = useState('#ffffff')
  const [creatingAccent, setCreatingAccent] = useState('#000000')
  const [creatingJerseyImage, setCreatingJerseyImage] = useState<string>('')

  const handleUploadLogo = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Seleziona un\'immagine'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `opponent-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('opponents-logos').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('opponents-logos').getPublicUrl(fileName)
      setLogoUrl(publicUrl)
      toast.success('Logo caricato')
    } catch (e) {
      console.error(e)
      toast.error('Errore upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleUploadJerseyImageCreate = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Seleziona un\'immagine'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `opponent-jersey-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('opponents-jerseys').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('opponents-jerseys').getPublicUrl(fileName)
      setCreatingJerseyImage(publicUrl)
      toast.success('Maglia caricata')
    } catch (e) {
      console.error(e)
      toast.error('Errore upload maglia')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Nome richiesto'); return }
    await createOpponent.mutateAsync({ 
      name: name.trim(), 
      logo_url: logoUrl || null,
      jersey_shape: creatingJerseyImage ? null : creatingShape,
      jersey_primary_color: creatingJerseyImage ? null : creatingPrimary,
      jersey_secondary_color: creatingJerseyImage ? null : creatingSecondary,
      jersey_accent_color: creatingJerseyImage ? null : creatingAccent,
      jersey_image_url: creatingJerseyImage || null
    } as any)
    setName(''); setLogoUrl(''); setOpen(false)
    setCreatingJerseyImage('')
  }

  const handleUpdateName = async (id: string, newName: string) => {
    await updateOpponent.mutateAsync({ id, data: { name: newName } })
  }
  const handleUpdateLogo = async (id: string, file: File) => {
    const ext = file.name.split('.').pop()
    const fileName = `opponent-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('opponents-logos').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) { toast.error('Upload fallito'); return }
    const { data: { publicUrl } } = supabase.storage.from('opponents-logos').getPublicUrl(fileName)
    await updateOpponent.mutateAsync({ id, data: { logo_url: publicUrl } })
  }

  const handleUpdateJerseyImage = async (id: string, file: File) => {
    const ext = file.name.split('.').pop()
    const fileName = `opponent-jersey-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('opponents-jerseys').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) { toast.error('Upload maglia fallito'); return }
    const { data: { publicUrl } } = supabase.storage.from('opponents-jerseys').getPublicUrl(fileName)
    await updateOpponent.mutateAsync({ id, data: { jersey_image_url: publicUrl, jersey_shape: null, jersey_primary_color: null, jersey_secondary_color: null, jersey_accent_color: null } })
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Avversari</CardTitle>
          <CardDescription>Gestisci anagrafica avversari e loghi</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="space-x-2"><Plus className="h-4 w-4" /><span>Nuovo Avversario</span></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo Avversario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Team Alpha" />
                </div>
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleUploadLogo(e.target.files[0])} />
                    {logoUrl && <span className="flex items-center gap-2 text-sm text-muted-foreground"><ImageIcon className="h-4 w-4" />Logo caricato</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Maglia Avversario</Label>
                  <div className="flex items-center gap-3">
                    <JerseyMini shape={creatingShape} primary={creatingPrimary} secondary={creatingSecondary} accent={creatingAccent} imageUrl={creatingJerseyImage} />
                    <select value={creatingShape} onChange={(e) => setCreatingShape(e.target.value as JerseyShape)} className="h-9 rounded border px-2 text-sm">
                      <option value="classic">Classic</option>
                      <option value="stripes">Strisce</option>
                      <option value="hoops">Orizzontali</option>
                    </select>
                    <input type="color" value={creatingPrimary} onChange={(e) => setCreatingPrimary(e.target.value)} title="Colore primario" />
                    <input type="color" value={creatingSecondary} onChange={(e) => setCreatingSecondary(e.target.value)} title="Colore secondario" />
                    <input type="color" value={creatingAccent} onChange={(e) => setCreatingAccent(e.target.value)} title="Colore accento" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleUploadJerseyImageCreate(e.target.files[0])} />
                    {creatingJerseyImage && <span className="text-xs text-muted-foreground">Immagine maglia caricata</span>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
                <Button onClick={handleCreate} disabled={createOpponent.isPending || uploading}>{createOpponent.isPending || uploading ? 'Creazione...' : 'Crea'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {opponents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nessun avversario</div>
            ) : opponents.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3 min-w-0">
                  {o.logo_url ? (
                    <img src={o.logo_url} alt={o.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-semibold">{o.name?.charAt(0)}</div>
                  )}
                  <Input defaultValue={o.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== o.name) handleUpdateName(o.id, v) }} className="w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleUpdateLogo(o.id, e.target.files[0])} className="w-40" />
                  <JerseyMini shape={o.jersey_shape} primary={o.jersey_primary_color} secondary={o.jersey_secondary_color} accent={o.jersey_accent_color} imageUrl={o.jersey_image_url} />
                  <select
                    defaultValue={o.jersey_shape || 'classic'}
                    onChange={(e) => updateOpponent.mutate({ id: o.id, data: { jersey_shape: e.target.value, jersey_image_url: null } })}
                    className="h-9 rounded border px-2 text-sm"
                  >
                    <option value="classic">Classic</option>
                    <option value="stripes">Strisce</option>
                    <option value="hoops">Orizzontali</option>
                  </select>
                  <input type="color" defaultValue={o.jersey_primary_color || '#008080'} onBlur={(e) => updateOpponent.mutate({ id: o.id, data: { jersey_primary_color: e.target.value, jersey_image_url: null } })} title="Colore primario" />
                  <input type="color" defaultValue={o.jersey_secondary_color || '#ffffff'} onBlur={(e) => updateOpponent.mutate({ id: o.id, data: { jersey_secondary_color: e.target.value, jersey_image_url: null } })} title="Colore secondario" />
                  <input type="color" defaultValue={o.jersey_accent_color || '#000000'} onBlur={(e) => updateOpponent.mutate({ id: o.id, data: { jersey_accent_color: e.target.value, jersey_image_url: null } })} title="Colore accento" />
                  <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleUpdateJerseyImage(o.id, e.target.files[0])} className="w-40" />
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-muted-foreground" />
                    <select
                      defaultValue={o.jersey_template_id || ''}
                      onChange={(e) => updateOpponent.mutate({ id: o.id, data: { jersey_template_id: e.target.value || null } })}
                      className="h-9 rounded border px-2 text-sm"
                    >
                      <option value="">Nessuna maglia</option>
                      {jerseys.map((j: any) => (
                        <option key={j.id} value={j.id}>{j.name || j.id}</option>
                      ))}
                    </select>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Elimina avversario</AlertDialogTitle>
                        <AlertDialogDescription>Questa azione è irreversibile.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteOpponent.mutate(o.id)}>Elimina</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OpponentsManagement