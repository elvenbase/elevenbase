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
import { Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react'

const OpponentsManagement = () => {
  const { data: opponents = [] } = useOpponents()
  const createOpponent = useCreateOpponent()
  const updateOpponent = useUpdateOpponent()
  const deleteOpponent = useDeleteOpponent()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)

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

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Nome richiesto'); return }
    await createOpponent.mutateAsync({ name: name.trim(), logo_url: logoUrl || null })
    setName(''); setLogoUrl(''); setOpen(false)
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