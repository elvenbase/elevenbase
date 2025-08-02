import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTrainingSession, useUpdateTrainingSession } from '@/hooks/useSupabaseData';
import { Plus, Edit } from 'lucide-react';

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
}

interface TrainingFormProps {
  children?: React.ReactNode;
  session?: TrainingSession;
  mode?: 'create' | 'edit';
  onOpenChange?: (open: boolean) => void;
}

export const TrainingForm = ({ children, session, mode = 'create', onOpenChange }: TrainingFormProps) => {
  const [open, setOpen] = useState(false);
  
  const getTomorrowDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: getTomorrowDate(),
    start_time: '21:00',
    end_time: '23:00',
    location: ''
  });

  const createTrainingSession = useCreateTrainingSession();
  const updateTrainingSession = useUpdateTrainingSession();

  // Popola il form con i dati della sessione se in modalità edit
  useEffect(() => {
    if (mode === 'edit' && session) {
      setFormData({
        title: session.title,
        description: session.description || '',
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location || ''
      });
    }
  }, [mode, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      title: formData.title,
      description: formData.description || undefined,
      session_date: formData.session_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location || undefined
    };

    if (mode === 'edit' && session) {
      await updateTrainingSession.mutateAsync({
        sessionId: session.id,
        updates: sessionData
      });
    } else {
      await createTrainingSession.mutateAsync(sessionData);
    }

    if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        session_date: getTomorrowDate(),
        start_time: '21:00',
        end_time: '23:00',
        location: ''
      });
    }
    
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            {mode === 'edit' ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {mode === 'edit' ? 'Modifica Sessione' : 'Nuova Sessione'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Modifica Sessione di Allenamento' : 'Nuova Sessione di Allenamento'}</DialogTitle>
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

          <div>
            <Label htmlFor="location">Luogo</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="es. Campo principale"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={createTrainingSession.isPending || updateTrainingSession.isPending}
            >
              {mode === 'edit' 
                ? (updateTrainingSession.isPending ? 'Aggiornamento...' : 'Aggiorna Sessione')
                : (createTrainingSession.isPending ? 'Creazione...' : 'Crea Sessione')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};