import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMatch, useCompetitions, useCreateCompetition } from '@/hooks/useSupabaseData';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MatchFormProps {
  children?: React.ReactNode;
}

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const MatchForm = ({ children }: MatchFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    opponent_name: '',
    match_date: getTomorrowDate(),
    match_time: '22:00',
    home_away: 'home' as 'home' | 'away',
    competition_name: '',
    notes: ''
  });
  const [opponentLogoUrl, setOpponentLogoUrl] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { toast } = useToast();
  const createMatch = useCreateMatch();
  const createCompetition = useCreateCompetition();
  const { data: competitions = [] } = useCompetitions();

  const competitionNames = useMemo(() => competitions.map((c: any) => c.name), [competitions]);

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        match_date: getTomorrowDate(),
        match_time: '22:00'
      }));
    }
  }, [open]);

  const handleUploadLogo = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast({ title: 'Formato non valido', description: 'Seleziona un\'immagine valida (JPG, PNG, etc.).', variant: 'destructive' });
      return;
    }
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `opponent-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('opponents-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('opponents-logos').getPublicUrl(fileName);
      setOpponentLogoUrl(publicUrl);
      toast({ title: 'Logo caricato' });
    } catch (err) {
      console.error('Upload logo error:', err);
      toast({ title: 'Errore di caricamento', description: 'Caricamento del logo non riuscito.', variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let competition_id: string | undefined = undefined;
    const name = formData.competition_name?.trim();
    if (name) {
      const existing = competitions.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        competition_id = existing.id;
      } else {
        const created = await createCompetition.mutateAsync({ name, type: 'championship' });
        competition_id = created?.id;
      }
    }

    const matchData: any = {
      opponent_name: formData.opponent_name,
      match_date: formData.match_date,
      match_time: formData.match_time,
      home_away: formData.home_away,
      competition_id,
      notes: formData.notes || undefined
    };
    if (opponentLogoUrl) matchData.opponent_logo_url = opponentLogoUrl;

    await createMatch.mutateAsync(matchData);
    setFormData({
      opponent_name: '',
      match_date: getTomorrowDate(),
      match_time: '22:00',
      home_away: 'home',
      competition_name: '',
      notes: ''
    });
    setOpponentLogoUrl('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Partita
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova Partita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="opponent_name">Avversario</Label>
            <Input
              id="opponent_name"
              value={formData.opponent_name}
              onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
              placeholder="es. Team Alpha"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="match_date">Data</Label>
              <Input
                id="match_date"
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="match_time">Ora</Label>
              <Input
                id="match_time"
                type="time"
                value={formData.match_time}
                onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="home_away">Casa/Trasferta</Label>
            <Select value={formData.home_away} onValueChange={(value: 'home' | 'away') => setFormData({ ...formData, home_away: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Casa</SelectItem>
                <SelectItem value="away">Trasferta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="competition_name">Competizione</Label>
            <Input
              id="competition_name"
              list="competition-suggestions"
              value={formData.competition_name}
              onChange={(e) => setFormData({ ...formData, competition_name: e.target.value })}
              placeholder="Scrivi il nome della competizione"
            />
            <datalist id="competition-suggestions">
              {competitionNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <Label>Logo avversario</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleUploadLogo(e.target.files[0])} />
              {opponentLogoUrl && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span>Logo caricato</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note aggiuntive..."
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createMatch.isPending || createCompetition.isPending || uploadingLogo}>
              {createMatch.isPending || createCompetition.isPending || uploadingLogo ? 'Creazione...' : 'Crea Partita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};