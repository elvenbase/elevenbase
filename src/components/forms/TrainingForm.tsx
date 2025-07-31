import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTrainingSession } from '@/hooks/useSupabaseData';
import { Plus } from 'lucide-react';

interface TrainingFormProps {
  children?: React.ReactNode;
}

export const TrainingForm = ({ children }: TrainingFormProps) => {
  const [open, setOpen] = useState(false);
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: getTomorrowDate(),
    start_time: '21:00',
    end_time: '23:00'
  });

  const createTrainingSession = useCreateTrainingSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      title: formData.title,
      description: formData.description || undefined,
      session_date: formData.session_date,
      start_time: formData.start_time,
      end_time: formData.end_time
    };

    await createTrainingSession.mutateAsync(sessionData);
    setFormData({
      title: '',
      description: '',
      session_date: getTomorrowDate(),
      start_time: '21:00',
      end_time: '23:00'
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Sessione
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova Sessione di Allenamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="es. Allenamento Tecnico"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrivi gli obiettivi dell'allenamento..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="session_date">Data</Label>
            <Input
              id="session_date"
              type="date"
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Inizio</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">Fine</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createTrainingSession.isPending}>
              {createTrainingSession.isPending ? 'Creazione...' : 'Crea Sessione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};