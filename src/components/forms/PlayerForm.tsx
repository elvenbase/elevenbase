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
    phone: ''
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
      phone: formData.phone || undefined
    };

    try {
      await createPlayer.mutateAsync(playerData);
      setFormData({
        first_name: '',
        last_name: '',
        jersey_number: '',
        position: '',
        status: 'active',
        phone: ''
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Giocatore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? 'Aggiungendo...' : 'Aggiungi Giocatore'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerForm;