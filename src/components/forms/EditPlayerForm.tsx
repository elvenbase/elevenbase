import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdatePlayer } from "@/hooks/useSupabaseData";
import { Edit } from "lucide-react";

interface EditPlayerFormProps {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    jersey_number?: number;
    position?: string;
    status: 'active' | 'inactive' | 'injured' | 'suspended';
  };
}

const EditPlayerForm = ({ player }: EditPlayerFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: player.first_name,
    last_name: player.last_name,
    jersey_number: player.jersey_number || '',
    position: player.position || '',
    status: player.status
  });

  const updatePlayer = useUpdatePlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePlayer.mutateAsync({
        id: player.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        jersey_number: formData.jersey_number ? Number(formData.jersey_number) : undefined,
        position: formData.position || undefined,
        status: formData.status
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Giocatore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jersey_number">Numero Maglia</Label>
              <Input
                id="jersey_number"
                type="number"
                min="1"
                max="99"
                value={formData.jersey_number}
                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posizione</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="es. Attaccante, Centrocampista..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'injured' | 'suspended') => setFormData({ ...formData, status: value })}>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={updatePlayer.isPending}>
              {updatePlayer.isPending ? "Aggiornamento..." : "Salva Modifiche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerForm;