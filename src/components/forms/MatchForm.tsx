import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMatch, useCompetitions } from '@/hooks/useSupabaseData';
import { Plus } from 'lucide-react';

interface MatchFormProps {
  children?: React.ReactNode;
}

export const MatchForm = ({ children }: MatchFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    opponent_name: '',
    match_date: '',
    match_time: '',
    home_away: 'home' as 'home' | 'away',
    location: '',
    competition_id: '',
    notes: ''
  });

  const createMatch = useCreateMatch();
  const { data: competitions = [] } = useCompetitions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const matchData = {
      opponent_name: formData.opponent_name,
      match_date: formData.match_date,
      match_time: formData.match_time,
      home_away: formData.home_away,
      location: formData.location || undefined,
      competition_id: formData.competition_id || undefined,
      notes: formData.notes || undefined
    };

    await createMatch.mutateAsync(matchData);
    setFormData({
      opponent_name: '',
      match_date: '',
      match_time: '',
      home_away: 'home',
      location: '',
      competition_id: '',
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
            <Label htmlFor="competition_id">Competizione</Label>
            <Select value={formData.competition_id} onValueChange={(value) => setFormData({ ...formData, competition_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona competizione" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((competition) => (
                  <SelectItem key={competition.id} value={competition.id}>
                    {competition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Luogo</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="es. Campo Sportivo Comunale"
            />
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
            <Button type="submit" disabled={createMatch.isPending}>
              {createMatch.isPending ? 'Creazione...' : 'Crea Partita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};