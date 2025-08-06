import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTrialist } from '@/hooks/useSupabaseData';
import { UserPlus } from 'lucide-react';

interface TrialistFormProps {
  children?: React.ReactNode;
}

export const TrialistFormSimple = ({ children }: TrialistFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    position: '',
    notes: '',
    esperienza: '',
    jersey_number: '',
    ea_sport_id: '',
    gaming_platform: 'none',
    platform_id: ''
  });

  const createTrialist = useCreateTrialist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trialistData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || undefined,
      birth_date: formData.birth_date || undefined,
      position: formData.position || undefined,
      notes: formData.notes || undefined,
      esperienza: formData.esperienza || undefined,
      jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : undefined,
      ea_sport_id: formData.ea_sport_id || undefined,
      gaming_platform: formData.gaming_platform || undefined,
      platform_id: formData.platform_id || undefined,
      status: 'in_prova' as const
    };

    try {
      await createTrialist.mutateAsync(trialistData);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        birth_date: '',
        position: '',
        notes: '',
        esperienza: '',
        jersey_number: '',
        ea_sport_id: '',
        gaming_platform: 'none',
        platform_id: ''
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error creating trialist:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Aggiungi Trialist
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Trialist</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Cognome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                type="text"
                placeholder="Nome"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cognome *</label>
              <Input
                type="text"
                placeholder="Cognome"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Telefono */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefono</label>
            <Input
              type="tel"
              placeholder="+39 123 456 7890"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {/* Data di nascita e Posizione */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data di Nascita</label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Posizione</label>
              <Input
                type="text"
                placeholder="es. Centrocampista"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
          </div>

          {/* Gaming Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">🎮 Dati Gaming</span>
              <span className="text-xs text-muted-foreground">(opzionale)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero Maglia</label>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  placeholder="1-99"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Piattaforma Gaming</label>
                <Select 
                  value={formData.gaming_platform} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gaming_platform: value, platform_id: value === 'PC' || value === 'Nintendo Switch' || value === 'none' ? prev.platform_id : '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona piattaforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuna</SelectItem>
                    <SelectItem value="PS5">🎮 PlayStation 5</SelectItem>
                    <SelectItem value="Xbox">🎮 Xbox Series X/S</SelectItem>
                    <SelectItem value="PC">💻 PC</SelectItem>
                    <SelectItem value="Nintendo Switch">🎮 Nintendo Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">EA Sports ID</label>
                <Input
                  type="text"
                  placeholder="ID EA Sports"
                  value={formData.ea_sport_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, ea_sport_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Platform ID 
                  {(formData.gaming_platform === 'PS5' || formData.gaming_platform === 'Xbox') && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Input
                  type="text"
                  placeholder={
                    formData.gaming_platform === 'PS5' ? 'PSN ID' :
                    formData.gaming_platform === 'Xbox' ? 'Xbox Gamertag' :
                    formData.gaming_platform === 'PC' ? 'Steam/Epic ID' :
                    formData.gaming_platform === 'Nintendo Switch' ? 'Nintendo ID' :
                    'ID Piattaforma'
                  }
                  value={formData.platform_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform_id: e.target.value }))}
                  required={formData.gaming_platform === 'PS5' || formData.gaming_platform === 'Xbox'}
                />
                {formData.gaming_platform && formData.gaming_platform !== 'none' && (
                  <p className="text-xs text-muted-foreground">
                    {formData.gaming_platform === 'PS5' && 'ID del tuo account PlayStation Network'}
                    {formData.gaming_platform === 'Xbox' && 'Il tuo Xbox Gamertag'}
                    {formData.gaming_platform === 'PC' && 'ID Steam, Epic Games o altro'}
                    {formData.gaming_platform === 'Nintendo Switch' && 'ID del tuo account Nintendo'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Esperienza */}
          <div className="space-y-2">
            <label className="text-sm font-medium">🏆 Esperienza Sportiva</label>
            <Textarea
              placeholder="Descrivi l'esperienza calcistica del trialist (squadre, campionati, livelli di gioco...)"
              value={formData.esperienza}
              onChange={(e) => setFormData(prev => ({ ...prev, esperienza: e.target.value }))}
              rows={3}
              style={{ fontSize: '16px' }}
              className="text-base"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Note aggiuntive sul trialist..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{ fontSize: '16px' }}
              className="text-base"
            />
          </div>

          {/* Pulsanti */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={createTrialist.isPending}
            >
              {createTrialist.isPending ? 'Aggiunta...' : 'Aggiungi Trialist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};