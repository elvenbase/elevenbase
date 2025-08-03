import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Parse existing location into communication type and details
  const parseLocation = (location?: string) => {
    if (!location) return { type: '', details: '' };
    
    if (location.toLowerCase().includes('party')) {
      return { type: 'party', details: '' };
    } else if (location.includes('discord.gg') || location.includes('discord.com')) {
      return { type: 'discord', details: location };
    } else if (location.toLowerCase() === 'discord') {
      return { type: 'discord', details: '' };
    } else if (location.toLowerCase() !== 'party' && location.toLowerCase() !== 'discord') {
      return { type: 'altro', details: location };
    }
    
    return { type: '', details: '' };
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: getTomorrowDate(),
    start_time: '21:00',
    end_time: '23:00',
    location: ''
  });

  const [communicationType, setCommunicationType] = useState('');
  const [communicationDetails, setCommunicationDetails] = useState('');

  const createTrainingSession = useCreateTrainingSession();
  const updateTrainingSession = useUpdateTrainingSession();

  useEffect(() => {
    if (session && mode === 'edit') {
      const parsed = parseLocation(session.location);
      setFormData({
        title: session.title,
        description: session.description || '',
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location || ''
      });
      setCommunicationType(parsed.type);
      setCommunicationDetails(parsed.details);
    }
  }, [session, mode]);

  const formatCommunicationLocation = () => {
    switch (communicationType) {
      case 'party':
        return 'Party';
      case 'discord':
        return communicationDetails || 'Discord';
      case 'altro':
        return communicationDetails || 'Altro';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      ...formData,
      location: formatCommunicationLocation()
    };

    try {
      if (mode === 'edit' && session) {
        await updateTrainingSession.mutateAsync({
          id: session.id,
          data: sessionData
        });
      } else {
        await createTrainingSession.mutateAsync(sessionData);
      }
      handleOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      session_date: getTomorrowDate(),
      start_time: '21:00',
      end_time: '23:00',
      location: ''
    });
    setCommunicationType('');
    setCommunicationDetails('');
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

          <div className="space-y-3">
            <Label>Comunicazioni</Label>
            <Select value={communicationType} onValueChange={setCommunicationType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona dove avverranno le comunicazioni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="party">Party</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
            
            {communicationType === 'discord' && (
              <div>
                <Label htmlFor="discord_url" className="text-sm text-muted-foreground">
                  URL canale Discord (opzionale)
                </Label>
                <Input
                  id="discord_url"
                  value={communicationDetails}
                  onChange={(e) => setCommunicationDetails(e.target.value)}
                  placeholder="https://discord.gg/... oppure link canale"
                />
              </div>
            )}
            
            {communicationType === 'altro' && (
              <div>
                <Label htmlFor="other_communication" className="text-sm text-muted-foreground">
                  Specifica dove
                </Label>
                <Input
                  id="other_communication"
                  value={communicationDetails}
                  onChange={(e) => setCommunicationDetails(e.target.value)}
                  placeholder="es. TeamSpeak, Telegram, etc."
                  required
                />
              </div>
            )}
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