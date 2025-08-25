import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const GlobalAdmin: React.FC = () => {
  const [jerseyUrl, setJerseyUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bgColor, setBgColor] = useState('#222222')
  const [uploadingJersey, setUploadingJersey] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const ensureGlobalAdmin = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Non autenticato')
    // Authorization enforced by RLS; keeping this check minimal
    return true
  }

  const loadCurrentDefaults = async () => {
    try {
      // Jersey default (system)
      const { data: sysJersey } = await supabase
        .from('jersey_templates')
        .select('image_url')
        .is('team_id', null)
        .is('created_by', null)
        .eq('is_default', true)
        .maybeSingle()
      if (sysJersey?.image_url) setJerseyUrl(sysJersey.image_url)

      // Avatar default (system)
      const { data: sysAvatar } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('team_id', null)
        .is('created_by', null)
        .eq('name', 'default-avatar')
        .eq('type', 'image')
        .eq('is_default', true)
        .maybeSingle()
      if (sysAvatar?.value) setAvatarUrl(sysAvatar.value)

      // Background default (system)
      const { data: sysBg } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('team_id', null)
        .is('created_by', null)
        .eq('name', 'system-default-background')
        .eq('type', 'color')
        .eq('is_default', true)
        .maybeSingle()
      if (sysBg?.value) setBgColor(sysBg.value)
    } catch {}
  }

  useEffect(() => { loadCurrentDefaults() }, [])

  const uploadJerseyImage = async (file: File) => {
    try {
      setUploadingJersey(true)
      await ensureGlobalAdmin()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `system-default-jersey-${Date.now()}.${ext}`
      const filePath = `jerseys/${fileName}`
      const { error: upErr } = await supabase.storage.from('jerseys').upload(filePath, file, { upsert: true })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('jerseys').getPublicUrl(filePath)
      setJerseyUrl(pub.publicUrl)
      toast.success('Immagine maglia caricata')
    } catch (e: any) {
      toast.error(e.message || 'Errore upload maglia')
    } finally {
      setUploadingJersey(false)
    }
  }

  const uploadAvatarImage = async (file: File) => {
    try {
      setUploadingAvatar(true)
      await ensureGlobalAdmin()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `system-default-avatar-${Date.now()}.${ext}`
      const filePath = `${fileName}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(pub.publicUrl)
      toast.success('Immagine avatar caricata')
    } catch (e: any) {
      toast.error(e.message || 'Errore upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveSystemJersey = async () => {
    try {
      await ensureGlobalAdmin()
      if (!jerseyUrl) throw new Error('Carica prima un\'immagine maglia')
      await supabase.from('jersey_templates').delete().is('team_id', null).is('created_by', null)
      const { error } = await supabase.from('jersey_templates').insert({
        name: 'System Default Jersey', description: 'Global default jersey', image_url: jerseyUrl,
        is_default: true, team_id: null, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Maglia di default globale salvata')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio maglia')
    }
  }

  const saveSystemAvatar = async () => {
    try {
      await ensureGlobalAdmin()
      if (!avatarUrl) throw new Error('Carica prima un\'immagine avatar')
      await supabase.from('avatar_assets').delete().is('team_id', null).is('created_by', null).eq('name', 'default-avatar')
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'default-avatar', type: 'image', value: avatarUrl,
        is_default: true, team_id: null, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Avatar di default globale salvato')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio avatar')
    }
  }

  const saveSystemAvatarBackground = async () => {
    try {
      await ensureGlobalAdmin()
      await supabase.from('avatar_assets').update({ is_default: false }).is('team_id', null).is('created_by', null)
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'system-default-background', type: 'color', value: bgColor,
        is_default: true, team_id: null, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Sfondo di default globale salvato')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio sfondo')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pannello Amministrazione Globale (provvisorio)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <div className="font-semibold">Maglia di default (globale)</div>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadJerseyImage(f) }} />
            {jerseyUrl && <img src={jerseyUrl} alt="jersey" className="h-24 border rounded" />}
            <Button disabled={uploadingJersey} onClick={saveSystemJersey}>Salva maglia default</Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Avatar di default (globale)</div>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatarImage(f) }} />
            {avatarUrl && <img src={avatarUrl} alt="avatar" className="h-24 w-24 rounded-full border" />}
            <Button disabled={uploadingAvatar} onClick={saveSystemAvatar}>Salva avatar default</Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Sfondo avatar di default (globale)</div>
            <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            <Button onClick={saveSystemAvatarBackground}>Salva sfondo default</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GlobalAdmin