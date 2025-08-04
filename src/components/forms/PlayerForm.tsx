import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePlayer } from '@/hooks/useSupabaseData';
import { UserPlus } from 'lucide-react';

interface PlayerFormProps {
  children?: React.ReactNode;
}

export const PlayerForm = ({ children }: PlayerFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    jersey_number: '',
    position: '',
    status: 'active',
    phone: '',
    ea_sport_id: '',
    gaming_platform: '',
    platform_id: ''
  });

  const createPlayer = useCreatePlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const playerData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : undefined,
      position: formData.position || undefined,
      status: formData.status as 'active' | 'inactive' | 'injured' | 'suspended',
      phone: formData.phone || undefined,
      ea_sport_id: formData.ea_sport_id || undefined,
      gaming_platform: formData.gaming_platform || undefined,
      platform_id: formData.platform_id || undefined
    };

    try {
      await createPlayer.mutateAsync(playerData);
      setFormData({
        first_name: '',
        last_name: '',
        jersey_number: '',
        position: '',
        status: 'active',
        phone: '',
        ea_sport_id: '',
        gaming_platform: '',
        platform_id: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Aggiungi Giocatore
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Aggiungi Nuovo Giocatore</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <form id="player-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                type="text"
                placeholder="Nome"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cognome</label>
              <Input
                type="text"
                placeholder="Cognome"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero Maglia</label>
              <Input
                type="number"
                placeholder="Es. 10"
                min="1"
                max="99"
                value={formData.jersey_number}
                onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Posizione</label>
              <Input
                type="text"
                placeholder="Ruolo (es. Centrocampista)"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefono</label>
            <Input
              type="tel"
              placeholder="+39 123 456 7890"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            {formData.phone && (
              <p className="text-xs text-muted-foreground">
                WhatsApp: https://wa.me/{formData.phone.replace(/[^0-9]/g, '')}
              </p>
            )}
          </div>

          {/* Gaming Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">🎮 Dati Gaming</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ID EA Sports</label>
              <Input
                type="text"
                placeholder="Es. EAPlayer123"
                value={formData.ea_sport_id}
                onChange={(e) => setFormData(prev => ({ ...prev, ea_sport_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Piattaforma</label>
              <Select value={formData.gaming_platform || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, gaming_platform: value === 'none' ? '' : value, platform_id: (value === 'PC' || value === 'none') ? '' : prev.platform_id }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna</SelectItem>
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="PS5">PlayStation 5</SelectItem>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.gaming_platform === 'PS5' || formData.gaming_platform === 'Xbox') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {formData.gaming_platform === 'PS5' ? 'PSN ID' : 'Xbox Live ID'}
                </label>
                <Input
                  type="text"
                  placeholder={formData.gaming_platform === 'PS5' ? 'Es. PSNPlayer123' : 'Es. XboxPlayer123'}
                  value={formData.platform_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform_id: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Stato</label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="inactive">Inattivo</SelectItem>
                <SelectItem value="injured">Infortunato</SelectItem>
                <SelectItem value="suspended">Squalificato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </form>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button type="submit" form="player-form" disabled={createPlayer.isPending}>
            {createPlayer.isPending ? 'Aggiungendo...' : 'Aggiungi Giocatore'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerForm;