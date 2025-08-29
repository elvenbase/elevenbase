import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const GlobalAdmin: React.FC = () => {
  const [jerseyUrl, setJerseyUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bgColor, setBgColor] = useState('#222222')
  const [logoUrl, setLogoUrl] = useState('')
  const [favicon16Url, setFavicon16Url] = useState('')
  const [favicon32Url, setFavicon32Url] = useState('')
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState('')
  const [loadingGifUrl, setLoadingGifUrl] = useState('')
  const [uploadingJersey, setUploadingJersey] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon16, setUploadingFavicon16] = useState(false)
  const [uploadingFavicon32, setUploadingFavicon32] = useState(false)
  const [uploadingAppleTouch, setUploadingAppleTouch] = useState(false)
  const [uploadingLoadingGif, setUploadingLoadingGif] = useState(false)

  const ensureGlobalAdmin = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Non autenticato')
    return true
  }

  const loadCurrentDefaults = async () => {
    try {
      // Jersey default (system): created_by NULL + is_default
      const { data: sysJersey } = await supabase
        .from('jersey_templates')
        .select('image_url')
        .is('created_by', null)
        .eq('is_default', true)
        .maybeSingle()
      if (sysJersey?.image_url) setJerseyUrl(sysJersey.image_url)

      // Avatar Persona default (system): created_by NULL + is_default + type=image + name
      const { data: sysAvatar } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'default-avatar')
        .eq('type', 'image')
        .eq('is_default', true)
        .maybeSingle()
      if (sysAvatar?.value) setAvatarUrl(sysAvatar.value)

      // Avatar Background default (system): created_by NULL + is_default + type=color
      const { data: sysBg } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'system-default-background')
        .eq('type', 'color')
        .eq('is_default', true)
        .maybeSingle()
      if (sysBg?.value) setBgColor(sysBg.value)

      // Logo sito (system): created_by NULL + name=site-logo
      const { data: sysLogo } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'site-logo')
        .eq('type', 'image')
        .maybeSingle()
      if (sysLogo?.value) setLogoUrl(sysLogo.value)

      // Favicon 16x16
      const { data: favicon16 } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'site-favicon-16x16')
        .eq('type', 'image')
        .maybeSingle()
      if (favicon16?.value) setFavicon16Url(favicon16.value)

      // Favicon 32x32
      const { data: favicon32 } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'site-favicon-32x32')
        .eq('type', 'image')
        .maybeSingle()
      if (favicon32?.value) setFavicon32Url(favicon32.value)

      // Apple Touch Icon 180x180
      const { data: appleTouch } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'site-apple-touch-icon')
        .eq('type', 'image')
        .maybeSingle()
      if (appleTouch?.value) setAppleTouchIconUrl(appleTouch.value)

      // Loading GIF sito (system): created_by NULL + name=site-loading-gif
      const { data: sysLoadingGif } = await supabase
        .from('avatar_assets')
        .select('value')
        .is('created_by', null)
        .eq('name', 'site-loading-gif')
        .eq('type', 'image')
        .maybeSingle()
      if (sysLoadingGif?.value) setLoadingGifUrl(sysLoadingGif.value)
    } catch (e) { void e }
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
      toast.success('Immagine Avatar Persona caricata')
    } catch (e: any) {
      toast.error(e.message || 'Errore upload Avatar Persona')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveSystemJersey = async () => {
    try {
      await ensureGlobalAdmin()
      if (!jerseyUrl) throw new Error('Carica prima un\'immagine maglia')
      // Clear previous system default
      await supabase.from('jersey_templates').delete().is('created_by', null)
      // Insert new system default (omit team_id key for compatibility)
      const { error } = await supabase.from('jersey_templates').insert({
        name: 'System Default Jersey', description: 'Global default jersey', image_url: jerseyUrl,
        is_default: true, created_by: null
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
      if (!avatarUrl) throw new Error('Carica prima un\'immagine di Avatar Persona')
      // Remove prior system default avatar persona
      await supabase.from('avatar_assets').delete().is('created_by', null).eq('name', 'default-avatar')
      // Insert new (omit team_id key)
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'default-avatar', type: 'image', value: avatarUrl,
        is_default: true, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Avatar Persona di default globale salvato')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio Avatar Persona')
    }
  }

  const saveSystemAvatarBackground = async () => {
    try {
      await ensureGlobalAdmin()
      // Reset prior system defaults (created_by NULL)
      await supabase.from('avatar_assets').update({ is_default: false }).is('created_by', null)
      // Insert new (omit team_id key)
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'system-default-background', type: 'color', value: bgColor,
        is_default: true, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Avatar Background di default globale salvato')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio Avatar Background')
    }
  }

  const uploadLogoImage = async (file: File) => {
    try {
      setUploadingLogo(true)
      await ensureGlobalAdmin()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `site-logo.${fileExt}`
      const filePath = `global/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setLogoUrl(data.publicUrl)
    } catch (e: any) {
      toast.error(e.message || 'Errore upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const saveSystemLogo = async () => {
    try {
      await ensureGlobalAdmin()
      // Remove existing site logo
      await supabase.from('avatar_assets').delete().is('created_by', null).eq('name', 'site-logo')
      // Insert new
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'site-logo', type: 'image', value: logoUrl,
        is_default: true, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Logo sito salvato con successo')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio logo')
    }
  }

  const uploadFaviconImage = async (file: File) => {
    try {
      setUploadingFavicon(true)
      await ensureGlobalAdmin()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `site-favicon.${fileExt}`
      const filePath = `global/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setFaviconUrl(data.publicUrl)
    } catch (e: any) {
      toast.error(e.message || 'Errore upload favicon')
    } finally {
      setUploadingFavicon(false)
    }
  }

  // Funzioni generiche per favicon
  const uploadFavicon = async (file: File, name: string, setter: (url: string) => void, setUploading: (loading: boolean) => void) => {
    try {
      setUploading(true)
      await ensureGlobalAdmin()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${name}.${fileExt}`
      const filePath = `global/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setter(data.publicUrl)
    } catch (e: any) {
      toast.error(e.message || 'Errore upload')
    } finally {
      setUploading(false)
    }
  }

  const saveFavicon = async (name: string, url: string, successMsg: string) => {
    try {
      await ensureGlobalAdmin()
      await supabase.from('avatar_assets').delete().is('created_by', null).eq('name', name)
      const { error } = await supabase.from('avatar_assets').insert({
        name, type: 'image', value: url, is_default: true, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success(successMsg)
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio')
    }
  }

  const uploadFavicon16 = (file: File) => uploadFavicon(file, 'site-favicon-16x16', setFavicon16Url, setUploadingFavicon16)
  const uploadFavicon32 = (file: File) => uploadFavicon(file, 'site-favicon-32x32', setFavicon32Url, setUploadingFavicon32)
  const uploadAppleTouch = (file: File) => uploadFavicon(file, 'site-apple-touch-icon', setAppleTouchIconUrl, setUploadingAppleTouch)

  const saveFavicon16 = () => saveFavicon('site-favicon-16x16', favicon16Url, 'Favicon 16x16 salvata')
  const saveFavicon32 = () => saveFavicon('site-favicon-32x32', favicon32Url, 'Favicon 32x32 salvata')
  const saveAppleTouch = () => saveFavicon('site-apple-touch-icon', appleTouchIconUrl, 'Apple Touch Icon salvata')

  const uploadLoadingGifImage = async (file: File) => {
    try {
      setUploadingLoadingGif(true)
      await ensureGlobalAdmin()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `site-loading-gif.${fileExt}`
      const filePath = `global/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setLoadingGifUrl(data.publicUrl)
    } catch (e: any) {
      toast.error(e.message || 'Errore upload loading GIF')
    } finally {
      setUploadingLoadingGif(false)
    }
  }

  const saveSystemLoadingGif = async () => {
    try {
      await ensureGlobalAdmin()
      // Remove existing loading gif
      await supabase.from('avatar_assets').delete().is('created_by', null).eq('name', 'site-loading-gif')
      // Insert new
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'site-loading-gif', type: 'image', value: loadingGifUrl,
        is_default: true, created_by: null
      })
      if (error) throw error
      await loadCurrentDefaults()
      toast.success('Loading GIF salvata con successo')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio loading GIF')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pannello Amministrazione Globale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <div className="font-semibold">Logo Sito (per navigazione e loader)</div>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoImage(f) }} />
            {logoUrl && <img src={logoUrl} alt="logo" className="h-16 border rounded" />}
            <Button disabled={uploadingLogo} onClick={saveSystemLogo}>
              {uploadingLogo ? 'Caricamento...' : 'Salva Logo Sito'}
            </Button>
          </div>
          <div className="space-y-4">
            <div className="font-semibold">Favicon Complete (16x16, 32x32, Apple Touch 180x180)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Favicon 16x16</Label>
                <Input type="file" accept="image/png,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFavicon16(f) }} />
                {favicon16Url && <img src={favicon16Url} alt="favicon 16x16" className="h-4 w-4 border rounded" />}
                <Button disabled={uploadingFavicon16} onClick={saveFavicon16} size="sm">
                  {uploadingFavicon16 ? 'Upload...' : 'Salva 16x16'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Favicon 32x32</Label>
                <Input type="file" accept="image/png,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFavicon32(f) }} />
                {favicon32Url && <img src={favicon32Url} alt="favicon 32x32" className="h-8 w-8 border rounded" />}
                <Button disabled={uploadingFavicon32} onClick={saveFavicon32} size="sm">
                  {uploadingFavicon32 ? 'Upload...' : 'Salva 32x32'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Apple Touch 180x180</Label>
                <Input type="file" accept="image/png,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAppleTouch(f) }} />
                {appleTouchIconUrl && <img src={appleTouchIconUrl} alt="apple touch" className="h-12 w-12 border rounded" />}
                <Button disabled={uploadingAppleTouch} onClick={saveAppleTouch} size="sm">
                  {uploadingAppleTouch ? 'Upload...' : 'Salva Apple'}
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">GIF Caricamento (per loader animati)</div>
            <Input type="file" accept="image/gif,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLoadingGifImage(f) }} />
            {loadingGifUrl && <img src={loadingGifUrl} alt="loading gif" className="h-16 border rounded" />}
            <Button disabled={uploadingLoadingGif} onClick={saveSystemLoadingGif}>
              {uploadingLoadingGif ? 'Caricamento...' : 'Salva Loading GIF'}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Maglia di default (globale)</div>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadJerseyImage(f) }} />
            {jerseyUrl && <img src={jerseyUrl} alt="jersey" className="h-24 border rounded" />}
            <Button disabled={uploadingJersey} onClick={saveSystemJersey}>
              {uploadingJersey ? 'Caricamento...' : 'Salva Maglia Default'}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Avatar Persona di default (globale)</div>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatarImage(f) }} />
            {avatarUrl && <img src={avatarUrl} alt="avatar" className="h-24 w-24 rounded-full border" />}
            <Button disabled={uploadingAvatar} onClick={saveSystemAvatar}>
              {uploadingAvatar ? 'Caricamento...' : 'Salva Avatar Default'}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Avatar Background di default (globale)</div>
            <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            <Button onClick={saveSystemAvatarBackground}>Salva Avatar Background Default</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GlobalAdmin