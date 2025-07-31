import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Players hooks
export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('last_name');
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (player: { first_name: string; last_name: string; jersey_number?: number; position?: string; status?: 'active' | 'inactive' | 'injured' | 'suspended' }) => {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({ title: "Giocatore aggiunto con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiunta del giocatore", variant: "destructive" });
    }
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; first_name?: string; last_name?: string; jersey_number?: number; position?: string; status?: 'active' | 'inactive' | 'injured' | 'suspended' }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({ title: "Giocatore aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento del giocatore", variant: "destructive" });
    }
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({ title: "Giocatore eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione del giocatore", variant: "destructive" });
    }
  });
};

export const usePlayerStatistics = (playerId: string) => {
  return useQuery({
    queryKey: ['player-statistics', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('player_id', playerId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!playerId
  });
};

// Training sessions hooks
export const useTrainingSessions = () => {
  return useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('session_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateTrainingSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (session: {
      title: string;
      description?: string;
      session_date: string;
      start_time: string;
      end_time: string;
      location?: string;
      max_participants?: number;
    }) => {
      const { data, error } = await supabase
        .from('training_sessions')
        .insert([{ ...session, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: "Sessione di allenamento creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante la creazione della sessione", variant: "destructive" });
    }
  });
};

// Competitions hooks
export const useCompetitions = () => {
  return useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateCompetition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (competition: {
      name: string;
      type: 'championship' | 'tournament' | 'friendly';
      description?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('competitions')
        .insert([{ ...competition, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast({ title: "Competizione creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante la creazione della competizione", variant: "destructive" });
    }
  });
};

// Trialists hooks
export const useTrialists = () => {
  return useQuery({
    queryKey: ['trialists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trialists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateTrialist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trialist: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      birth_date?: string;
      position?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('trialists')
        .insert([{ ...trialist, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      toast({ title: "Trialist aggiunto con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiunta del trialist", variant: "destructive" });
    }
  });
};

export const useUpdateTrialistStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'in_prova' | 'promosso' | 'archiviato' }) => {
      const { data, error } = await supabase
        .from('trialists')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      toast({ title: "Status trialist aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });
};

// Stats hooks
export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const [playersResult, sessionsResult, competitionsResult, trialistsResult] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('training_sessions').select('id', { count: 'exact' }),
        supabase.from('competitions').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('trialists').select('id', { count: 'exact' }).eq('status', 'in_prova')
      ]);

      return {
        activePlayers: playersResult.count || 0,
        trainingSessions: sessionsResult.count || 0,
        activeCompetitions: competitionsResult.count || 0,
        activeTrials: trialistsResult.count || 0
      };
    }
  });
};

export const useTrialistStats = () => {
  return useQuery({
    queryKey: ['trialist-stats'],
    queryFn: async () => {
      const [inTrialResult, promotedResult, archivedResult, evaluationsResult] = await Promise.all([
        supabase.from('trialists').select('id', { count: 'exact' }).eq('status', 'in_prova'),
        supabase.from('trialists').select('id', { count: 'exact' }).eq('status', 'promosso'),
        supabase.from('trialists').select('id', { count: 'exact' }).eq('status', 'archiviato'),
        supabase.from('trial_evaluations').select('overall_rating')
      ]);

      const ratings = evaluationsResult.data?.map(e => e.overall_rating).filter(r => r !== null) || [];
      const averageRating = ratings.length > 0 ? 
        ratings.reduce((sum, rating) => sum + (rating || 0), 0) / ratings.length : 0;

      return {
        inTrial: inTrialResult.count || 0,
        promoted: promotedResult.count || 0,
        archived: archivedResult.count || 0,
        averageRating: Number(averageRating.toFixed(1))
      };
    }
  });
};