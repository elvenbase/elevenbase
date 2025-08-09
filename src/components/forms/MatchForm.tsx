import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMatch, useCompetitions, useCreateCompetition } from '@/hooks/useSupabaseData';
import { Plus } from 'lucide-react';

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

    const matchData = {
      opponent_name: formData.opponent_name,
      match_date: formData.match_date,
      match_time: formData.match_time,
      home_away: formData.home_away,
      competition_id,
      notes: formData.notes || undefined
    };

    await createMatch.mutateAsync(matchData);
    setFormData({
      opponent_name: '',
      match_date: getTomorrowDate(),
      match_time: '22:00',
      home_away: 'home',
      competition_name: '',
      notes: ''
    });
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
            <Button type="submit" disabled={createMatch.isPending || createCompetition.isPending}>
              {createMatch.isPending || createCompetition.isPending ? 'Creazione...' : 'Crea Partita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};