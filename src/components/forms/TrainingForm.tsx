import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTrainingSession, useUpdateTrainingSession, useTrialists, useSetTrainingTrialistInvites, useTrainingTrialistInvites } from '@/hooks/useSupabaseData';
import { Plus, Edit } from 'lucide-react';

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string; // Deprecato - mantenuto per retrocompatibilità
  communication_type?: 'party' | 'discord' | 'altro';
  communication_details?: string;
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

  // Parse communication data from session
  const parseCommunication = (session?: TrainingSession) => {
    if (!session) return { type: '', details: '' };
    
    // Usa i nuovi campi se disponibili
    if (session.communication_type) {
      return { 
        type: session.communication_type, 
        details: session.communication_details || '' 
      };
    }
    
    // Fallback per retrocompatibilità con il campo location
    const location = session.location;
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
    max_participants: undefined as number | undefined
  });

  const [communicationType, setCommunicationType] = useState('');
  const [communicationDetails, setCommunicationDetails] = useState('');

  const createTrainingSession = useCreateTrainingSession();
  const updateTrainingSession = useUpdateTrainingSession();
  const { data: trialists = [] } = useTrialists();
  const setTrialistInvites = useSetTrainingTrialistInvites();
  const { data: existingTrialistInvites = [] } = useTrainingTrialistInvites(session?.id || '');
  const [includeTrialists, setIncludeTrialists] = useState(false);
  const [selectedTrialists, setSelectedTrialists] = useState<string[]>([]);

  useEffect(() => {
    if (session && mode === 'edit') {
      const parsed = parseCommunication(session);
      setFormData({
        title: session.title,
        description: session.description || '',
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        max_participants: session.max_participants
      });
      setCommunicationType(parsed.type);
      setCommunicationDetails(parsed.details);
      
      // Controlla se ci sono già provinanti associati alla sessione
      if (existingTrialistInvites.length > 0) {
        setIncludeTrialists(true);
        const trialistIds = existingTrialistInvites.map((invite: any) => invite.trialist_id);
        setSelectedTrialists(trialistIds);
      }
    }
  }, [session, mode, existingTrialistInvites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      title: formData.title,
      description: formData.description || undefined,
      session_date: formData.session_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      communication_type: communicationType && communicationType.trim() !== '' ? communicationType : null,
      communication_details: communicationDetails && communicationDetails.trim() !== '' ? communicationDetails : null,
      max_participants: formData.max_participants
    };

    try {
      if (mode === 'edit' && session) {
        await updateTrainingSession.mutateAsync({
          id: session.id,
          data: sessionData
        });
        if (includeTrialists) {
          await setTrialistInvites.mutateAsync({ sessionId: session.id, trialistIds: selectedTrialists })
        }
      } else {
        const created = await createTrainingSession.mutateAsync(sessionData);
        if (includeTrialists && created?.id) {
          await setTrialistInvites.mutateAsync({ sessionId: created.id, trialistIds: selectedTrialists })
        }
      }
      handleOpenChange(false);
    } catch (error: any) {
      try { console.error('Error submitting form:', JSON.stringify(error)); } catch { console.error('Error submitting form:', error); }
      const message = [
        error?.message && `Messaggio: ${error.message}`,
        error?.details && `Dettagli: ${error.details}`,
        error?.hint && `Hint: ${error.hint}`,
        error?.code && `Codice: ${error.code}`
      ].filter(Boolean).join('\n');
      alert(message || 'Errore durante l\'invio della form');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      session_date: getTomorrowDate(),
      start_time: '21:00',
      end_time: '23:00',
      max_participants: undefined
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
      <DialogContent className="max-w-[95vw] w-full max-w-md max-h-[75vh] sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Modifica Sessione di Allenamento' : 'Nuova Sessione di Allenamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-4">
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
              rows={2}
              className="resize-none"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm">Comunicazioni</Label>
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

          <div className="space-y-2">
            <Label className="text-sm">Provinanti</Label>
            <div className="flex items-center gap-2">
              <input id="include_trialists" type="checkbox" checked={includeTrialists} onChange={(e) => setIncludeTrialists(e.target.checked)} />
              <label htmlFor="include_trialists" className="text-sm">Includi provinanti in questa convocazione</label>
            </div>
            {includeTrialists && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Seleziona i provinanti</Label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                  {trialists.map((t: any) => {
                    const checked = selectedTrialists.includes(t.id)
                    return (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={checked} onChange={(e) => {
                          setSelectedTrialists(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id))
                        }} />
                        <span className="truncate">{t.first_name} {t.last_name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:space-x-2 sm:space-y-0 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={createTrainingSession.isPending || updateTrainingSession.isPending}
              className="w-full sm:w-auto order-1 sm:order-2"
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