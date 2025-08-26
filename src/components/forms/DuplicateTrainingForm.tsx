import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  team_id: string;
}

interface DuplicateTrainingFormProps {
  session: TrainingSession;
}

export const DuplicateTrainingForm = ({ session }: DuplicateTrainingFormProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${session.title} (Copia)`);
  const [description, setDescription] = useState(session.description || '');
  const [sessionDate, setSessionDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(session.start_time);
  const [endTime, setEndTime] = useState(session.end_time);
  const [location, setLocation] = useState(session.location || '');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const duplicateSession = useMutation({
    mutationFn: async () => {
      console.log('🔄 Duplicating session:', { 
        title, 
        team_id: session.team_id, 
        session_date: sessionDate 
      });
      
      const { data, error } = await supabase
        .from('training_sessions')
        .insert([{
          title,
          description,
          session_date: sessionDate,
          start_time: startTime,
          end_time: endTime,
          location,
          max_participants: session.max_participants,
          team_id: session.team_id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Duplicate session error:', error);
        throw error;
      }
      
      console.log('✅ Session duplicated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: "Sessione duplicata con successo" });
      setOpen(false);
    },
    onError: (error: any) => {
      console.error('❌ Duplicate session mutation error:', error);
      toast({ 
        title: "Errore durante la duplicazione della sessione", 
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    duplicateSession.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Copy className="mr-2 h-4 w-4" />
          Duplica Sessione
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplica Sessione di Allenamento</DialogTitle>
          <DialogDescription>
            Modifica i dettagli per la nuova sessione di allenamento
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sessionDate">Data</Label>
            <Input
              id="sessionDate"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Ora inizio</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Ora fine</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Comunicazioni</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="es. Party, Discord, TeamSpeak..."
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={duplicateSession.isPending}>
              {duplicateSession.isPending ? 'Duplicando...' : 'Duplica Sessione'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};