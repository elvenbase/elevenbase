import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const GlobalAdmin: React.FC = () => {
  const [jerseyUrl, setJerseyUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bgColor, setBgColor] = useState('#222222')

  const ensureGlobalAdmin = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Non autenticato')
    const email = (user.user as any).email
    if (email !== 'coach@elevenbase.pro') throw new Error('Solo global admin')
  }

  const saveSystemJersey = async () => {
    try {
      await ensureGlobalAdmin()
      // Upsert system default jersey (team_id NULL, created_by NULL)
      await supabase.from('jersey_templates').delete().is('team_id', null).is('created_by', null)
      const { error } = await supabase.from('jersey_templates').insert({
        name: 'System Default Jersey',
        description: 'Global default jersey',
        image_url: jerseyUrl,
        is_default: true,
        team_id: null,
        created_by: null
      })
      if (error) throw error
      toast.success('Maglia di default globale salvata')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio maglia')
    }
  }

  const saveSystemAvatar = async () => {
    try {
      await ensureGlobalAdmin()
      // Upsert system default avatar image asset (name default-avatar)
      await supabase.from('avatar_assets').delete().is('team_id', null).is('created_by', null).eq('name', 'default-avatar')
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'default-avatar',
        type: 'image',
        value: avatarUrl,
        is_default: true,
        team_id: null,
        created_by: null
      })
      if (error) throw error
      toast.success('Avatar di default globale salvato')
    } catch (e: any) {
      toast.error(e.message || 'Errore salvataggio avatar')
    }
  }

  const saveSystemAvatarBackground = async () => {
    try {
      await ensureGlobalAdmin()
      // Upsert system default avatar background color asset
      await supabase.from('avatar_assets').update({ is_default: false }).is('team_id', null).is('created_by', null)
      const { error } = await supabase.from('avatar_assets').insert({
        name: 'system-default-background',
        type: 'color',
        value: bgColor,
        is_default: true,
        team_id: null,
        created_by: null
      })
      if (error) throw error
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="font-semibold">Maglia di default (globale)</div>
            <Input placeholder="URL immagine maglia" value={jerseyUrl} onChange={(e) => setJerseyUrl(e.target.value)} />
            <Button onClick={saveSystemJersey}>Salva maglia default</Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Avatar di default (globale)</div>
            <Input placeholder="URL immagine avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            <Button onClick={saveSystemAvatar}>Salva avatar default</Button>
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