import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
  status: 'active' | 'inactive' | 'injured' | 'suspended'
  phone?: string
  avatar_url?: string
  ea_sport_id?: string
  gaming_platform?: string
  platform_id?: string
}

interface EditPlayerFormProps {
  player: Player
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

const POSITIONS = [
  'Portiere',
  'Difensore Centrale',
  'Terzino Destro',
  'Terzino Sinistro',
  'Centrocampista Centrale',
  'Centrocampista Offensivo',
  'Centrocampista Difensivo',
  'Ala Destra',
  'Ala Sinistra',
  'Prima Punta',
  'Seconda Punta'
]

const GAMING_PLATFORMS = [
  'PC',
  'PS5',
  'Xbox'
]

export const EditPlayerForm: React.FC<EditPlayerFormProps> = ({
  player,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    first_name: player.first_name,
    last_name: player.last_name,
    jersey_number: player.jersey_number || '',
    position: player.position || '',
    status: player.status,
    phone: player.phone || '',
    ea_sport_id: player.ea_sport_id || '',
    gaming_platform: player.gaming_platform || '',
    platform_id: player.platform_id || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepara i dati per l'update, includendo solo i campi supportati dal database
      const updateData: any = {
        id: player.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number.toString()) : null,
        position: formData.position || null,
        status: formData.status,
        phone: formData.phone || null,
        avatar_url: player.avatar_url
      }

      // Aggiungi i campi gaming solo se supportati (verranno ignorati se non esistono)
      if (formData.ea_sport_id) updateData.ea_sport_id = formData.ea_sport_id
      if (formData.gaming_platform) updateData.gaming_platform = formData.gaming_platform  
      if (formData.platform_id) updateData.platform_id = formData.platform_id

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', player.id)

      if (error) throw error

      toast.success('Giocatore aggiornato con successo')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Errore nell\'aggiornamento del giocatore:', error)
      toast.error('Errore nell\'aggiornamento del giocatore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Giocatore</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jersey_number">Numero Maglia</Label>
              <Input
                id="jersey_number"
                type="number"
                min="1"
                max="99"
                value={formData.jersey_number}
                onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="position">Ruolo</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+39 123 456 7890"
            />
          </div>

          <div>
            <Label htmlFor="status">Stato</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="inactive">Inattivo</SelectItem>
                <SelectItem value="injured">Infortunato</SelectItem>
                <SelectItem value="suspended">Squalificato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Informazioni Gaming (opzionali)</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="ea_sport_id">EA Sports ID</Label>
                <Input
                  id="ea_sport_id"
                  value={formData.ea_sport_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, ea_sport_id: e.target.value }))}
                  placeholder="Il tuo ID EA Sports"
                />
              </div>

              <div>
                <Label htmlFor="gaming_platform">Piattaforma Gaming</Label>
                <Select
                  value={formData.gaming_platform}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gaming_platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona piattaforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMING_PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.gaming_platform && formData.gaming_platform !== 'PC' && (
                <div>
                  <Label htmlFor="platform_id">
                    {formData.gaming_platform === 'PS5' ? 'PSN ID' : 'Xbox Live ID'}
                  </Label>
                  <Input
                    id="platform_id"
                    value={formData.platform_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform_id: e.target.value }))}
                    placeholder={formData.gaming_platform === 'PS5' ? 'Il tuo PSN ID' : 'Il tuo Xbox Live ID'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Aggiornamento...' : 'Aggiorna'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
