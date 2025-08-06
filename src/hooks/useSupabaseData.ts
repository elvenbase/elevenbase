import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, endOfDay, subMonths } from 'date-fns';

// Players hooks
export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('last_name');
      
      if (error) {
        console.error('Error fetching players:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return data;
    }
  });
};

// Enhanced players hook with attendance stats
export const usePlayersWithAttendance = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['players-with-attendance', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      // First get all players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('last_name');
      
      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw playersError;
      }

      if (!startDate || !endDate) {
        return players.map(player => ({
          ...player,
          presences: 0,
          tardiness: 0,
          totalEvents: 0,
          attendanceRate: 0
        }));
      }
      
      // Prima recupera le sessioni chiuse nel periodo
      // Fix timezone issue: use local date formatting instead of ISO
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      const { data: closedSessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id, session_date, is_closed, title')
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr)
        .eq('is_closed', true);
      
      if (sessionsError) {
        console.error('Error fetching training sessions:', sessionsError);
        throw sessionsError;
      }
      
      const sessionIds = closedSessions?.map(s => s.id) || [];
      
      // Poi recupera le presenze per quelle sessioni
      let trainingAttendance = [];
      if (sessionIds.length > 0) {
        const { data, error: trainingError } = await supabase
          .from('training_attendance')
          .select('player_id, status, arrival_time, session_id')
          .in('session_id', sessionIds);
        
        if (trainingError) {
          console.error('Error fetching training attendance:', trainingError);
          throw trainingError;
        }
        
        trainingAttendance = data || [];
      }
      

      // Get match attendance stats
      const { data: matchAttendance, error: matchError } = await supabase
        .from('match_attendance')
        .select(`
          player_id,
          status,
          matches!inner(match_date)
        `)
        .gte('matches.match_date', startDate.toISOString().split('T')[0])
        .lte('matches.match_date', endDate.toISOString().split('T')[0]);

      if (matchError) {
        console.error('Error fetching match attendance:', matchError);
        throw matchError;
      }

      // Calculate stats for each player
      return players.map(player => {
        const playerTrainingAttendance = trainingAttendance.filter(ta => ta.player_id === player.id);
        const playerMatchAttendance = matchAttendance.filter(ma => ma.player_id === player.id);
        
        const trainingPresences = playerTrainingAttendance.filter(ta => ta.status === 'present').length;
        const trainingTardiness = playerTrainingAttendance.filter(ta => ta.status === 'present' && ta.arrival_time !== null).length;
        
        const matchPresences = playerMatchAttendance.filter(ma => ma.status === 'present').length;
        const matchTardiness = playerMatchAttendance.filter(ma => ma.status === 'late').length;
        
        const totalPresences = trainingPresences + matchPresences;
        const totalTardiness = trainingTardiness + matchTardiness;
        const totalEvents = playerTrainingAttendance.length + playerMatchAttendance.length;
        const attendanceRate = totalEvents > 0 ? Math.round((totalPresences / totalEvents) * 100) : 0;

        return {
          ...player,
          presences: totalPresences,
          tardiness: totalTardiness,
          totalEvents,
          attendanceRate
        };
      });
    },
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (player: { 
      first_name: string; 
      last_name: string; 
      jersey_number?: number; 
      position?: string; 
      status?: 'active' | 'inactive' | 'injured' | 'suspended'; 
      phone?: string;
      birth_date?: string;
      email?: string;
      esperienza?: string;
      notes?: string;
      avatar_url?: string;
      ea_sport_id?: string;
      gaming_platform?: string;
      platform_id?: string;
      is_captain?: boolean;
      created_by?: string;
    }) => {
      console.log('Creating player:', player);
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating player:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] });
      toast({ title: "Giocatore aggiunto con successo" });
    },
    onError: (error) => {
      console.error('Player creation failed:', error);
      toast({ title: "Errore durante l'aggiunta del giocatore", variant: "destructive" });
    }
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      first_name?: string; 
      last_name?: string; 
      jersey_number?: number; 
      position?: string; 
      status?: 'active' | 'inactive' | 'injured' | 'suspended'; 
      phone?: string;
      birth_date?: string;
      email?: string;
      esperienza?: string;
      notes?: string;
      avatar_url?: string;
      ea_sport_id?: string;
      gaming_platform?: string;
      platform_id?: string;
      is_captain?: boolean;
      created_by?: string;
    }) => {
      console.log('Updating player:', id, updates);
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating player:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] });
      toast({ title: "Giocatore aggiornato con successo" });
    },
    onError: (error) => {
      console.error('Player update failed:', error);
      toast({ title: "Errore durante l'aggiornamento del giocatore", variant: "destructive" });
    }
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting player:', id);
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting player:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] });
      toast({ title: "Giocatore eliminato con successo" });
    },
    onError: (error) => {
      console.error('Player deletion failed:', error);
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
      communication_type?: string | null;
      communication_details?: string | null;
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

export const useDuplicateTrainingSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Prima ottieni la sessione originale
      const { data: originalSession, error: fetchError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (fetchError) throw fetchError;

      // Crea una nuova sessione con gli stessi dati ma nuova data
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const newDate = tomorrow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('training_sessions')
        .insert([{
          title: `${originalSession.title} (Copia)`,
          description: originalSession.description,
          session_date: newDate,
          start_time: originalSession.start_time,
          end_time: originalSession.end_time,
          location: originalSession.location,
          max_participants: originalSession.max_participants,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: "Sessione duplicata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante la duplicazione della sessione", variant: "destructive" });
    }
  });
};

export const useUpdateTrainingSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string;
      data: {
        title?: string;
        description?: string;
        session_date?: string;
        start_time?: string;
        end_time?: string;
        communication_type?: string | null;
        communication_details?: string | null;
        max_participants?: number;
        allow_responses_until?: string | null;
      };
    }) => {
      const { data: result, error } = await supabase
        .from('training_sessions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: "Sessione aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento della sessione", variant: "destructive" });
    }
  });
};

export const useDeleteTrainingSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Prima elimina i dati correlati
      await supabase.from('training_attendance').delete().eq('session_id', sessionId);
      await supabase.from('training_lineups').delete().eq('session_id', sessionId);
      
      // Poi elimina la sessione
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: "Sessione eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione della sessione", variant: "destructive" });
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
      avatar_url?: string;
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

export const useUpdateTrialist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; first_name?: string; last_name?: string; email?: string; phone?: string; birth_date?: string; position?: string; status?: 'in_prova' | 'promosso' | 'archiviato'; notes?: string; avatar_url?: string }) => {
      console.log('Updating trialist:', id, updates);
      const { data, error } = await supabase
        .from('trialists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating trialist:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      toast({ title: "Trialist aggiornato con successo" });
    },
    onError: (error) => {
      console.error('Trialist update failed:', error);
      toast({ title: "Errore durante l'aggiornamento del trialist", variant: "destructive" });
    }
  });
};

export const useDeleteTrialist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trialists')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting trialist:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      queryClient.invalidateQueries({ queryKey: ['trialist-stats'] });
      toast({ title: "Trialist eliminato con successo" });
    },
    onError: (error) => {
      console.error('Trialist deletion failed:', error);
      toast({ title: "Errore durante l'eliminazione del trialist", variant: "destructive" });
    }
  });
};

// Hook to get available jersey numbers
export const useAvailableJerseyNumbers = () => {
  return useQuery({
    queryKey: ['available-jersey-numbers'],
    queryFn: async () => {
      const { data: players, error } = await supabase
        .from('players')
        .select('jersey_number')
        .not('jersey_number', 'is', null);

      if (error) throw error;

      const usedNumbers = new Set((players || []).map(p => p.jersey_number));
      const availableNumbers = [];
      
      for (let i = 0; i <= 99; i++) {
        if (!usedNumbers.has(i)) {
          availableNumbers.push(i);
        }
      }
      
      return availableNumbers;
    }
  });
};

export const usePromoteTrialist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ trialistId, jerseyNumber }: { trialistId: string; jerseyNumber: number }) => {
      // 1. Fetch trialist data
      const { data: trialist, error: fetchError } = await supabase
        .from('trialists')
        .select('*')
        .eq('id', trialistId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching trialist:', fetchError);
        throw fetchError;
      }

      if (!trialist) {
        throw new Error('Trialist not found');
      }

      if (trialist.status !== 'promosso') {
        throw new Error('Only promoted trialists can be moved to squad');
      }

      // 2. Get current user for created_by field
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // 3. Map trialist data to player data
      const playerData = {
        first_name: trialist.first_name,
        last_name: trialist.last_name,
        jersey_number: jerseyNumber, // Use selected jersey number
        position: trialist.position,
        phone: trialist.phone,
        birth_date: trialist.birth_date,
        email: trialist.email,
        esperienza: trialist.esperienza,
        notes: trialist.notes,
        avatar_url: trialist.avatar_url,
        ea_sport_id: trialist.ea_sport_id,
        gaming_platform: trialist.gaming_platform,
        platform_id: trialist.platform_id,
        is_captain: trialist.is_captain || false,
        status: 'active' as const, // Convert from 'promosso' to 'active'
        created_by: currentUserId
      };

      // 4. Create player
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert(playerData)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating player:', createError);
        throw createError;
      }

      // 5. Transfer quick trial evaluations to player evaluations
      const { data: quickEvaluations, error: evalFetchError } = await supabase
        .from('quick_trial_evaluations')
        .select('*')
        .eq('trialist_id', trialistId);

      if (evalFetchError) {
        console.error('Error fetching quick evaluations:', evalFetchError);
        // Don't fail the promotion if evaluations can't be fetched
      }

      if (quickEvaluations && quickEvaluations.length > 0) {
        const playerEvaluations = quickEvaluations.map(evaluation => ({
          player_id: newPlayer.id,
          original_trialist_id: trialistId,
          evaluation_date: evaluation.evaluation_date,
          personality_ratings: evaluation.personality_ratings,
          ability_ratings: evaluation.ability_ratings,
          flexibility_ratings: evaluation.flexibility_ratings,
          final_decision: evaluation.final_decision,
          notes: evaluation.notes,
          evaluator_id: evaluation.evaluator_id
        }));

        const { error: evalInsertError } = await supabase
          .from('player_evaluations')
          .insert(playerEvaluations);

        if (evalInsertError) {
          console.error('Error transferring evaluations:', evalInsertError);
          // Don't fail the promotion if evaluations can't be transferred
        }
      }

      // 6. Delete trialist (this will cascade delete quick_trial_evaluations)
      const { error: deleteError } = await supabase
        .from('trialists')
        .delete()
        .eq('id', trialistId);
      
      if (deleteError) {
        console.error('Error deleting trialist:', deleteError);
        // If deletion fails, we should ideally rollback the player creation
        // For now, we'll just log it but still return success
      }

      return {
        newPlayer,
        originalTrialist: trialist
      };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players-with-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      queryClient.invalidateQueries({ queryKey: ['trialist-stats'] });
      queryClient.invalidateQueries({ queryKey: ['available-jersey-numbers'] });
      
      toast({ 
        title: "Promozione completata! 🎉", 
        description: `${data.originalTrialist.first_name} ${data.originalTrialist.last_name} è stato aggiunto alla squadra ufficiale con il numero ${data.newPlayer.jersey_number}.`
      });
    },
    onError: (error) => {
      console.error('Trialist promotion failed:', error);
      toast({ 
        title: "Errore durante la promozione", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
};

// Trial Evaluations hooks
export const useTrialEvaluations = (trialistId?: string) => {
  return useQuery({
    queryKey: ['trial-evaluations', trialistId],
    queryFn: async () => {
      const query = supabase
        .from('trial_evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });
      
      if (trialistId) {
        query.eq('trialist_id', trialistId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!trialistId
  });
};

export const useCreateTrialEvaluation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (evaluation: {
      trialist_id: string;
      technical_score?: number;
      physical_score?: number;
      tactical_score?: number;
      attitude_score?: number;
      notes?: string;
      evaluation_date?: string;
    }) => {
      // Calculate overall rating from individual scores
      const scores = [
        evaluation.technical_score,
        evaluation.physical_score,
        evaluation.tactical_score,
        evaluation.attitude_score
      ].filter(score => score !== undefined && score !== null) as number[];
      
      const overall_rating = scores.length > 0 ? 
        scores.reduce((sum, score) => sum + score, 0) / scores.length : null;

      const { data, error } = await supabase
        .from('trial_evaluations')
        .insert([{
          ...evaluation,
          overall_rating,
          evaluator_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trial-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['trialist-stats'] });
      toast({ title: "Valutazione salvata con successo" });
    },
    onError: (error) => {
      console.error('Trial evaluation creation failed:', error);
      toast({ title: "Errore durante il salvataggio della valutazione", variant: "destructive" });
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

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const [playersResult, trainingsResult, competitionsResult, trialistsResult] = await Promise.all([
        supabase.from('players').select('first_name, last_name, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('training_sessions').select('title, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('competitions').select('name, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('trialists').select('first_name, last_name, created_at').order('created_at', { ascending: false }).limit(3)
      ]);

      const activities: Array<{type: string, message: string, timestamp: string}> = [];

      playersResult.data?.forEach(player => {
        activities.push({
          type: 'player',
          message: `Nuovo giocatore: ${player.first_name} ${player.last_name}`,
          timestamp: player.created_at
        });
      });

      trainingsResult.data?.forEach(training => {
        activities.push({
          type: 'training',
          message: `Allenamento programmato: ${training.title}`,
          timestamp: training.created_at
        });
      });

      competitionsResult.data?.forEach(competition => {
        activities.push({
          type: 'competition',
          message: `Nuova competizione: ${competition.name}`,
          timestamp: competition.created_at
        });
      });

      trialistsResult.data?.forEach(trialist => {
        activities.push({
          type: 'trialist',
          message: `Nuovo candidato: ${trialist.first_name} ${trialist.last_name}`,
          timestamp: trialist.created_at
        });
      });

      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }
  });
};

// Training Statistics hooks
export const useTrainingStats = () => {
  return useQuery({
    queryKey: ['training-stats'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [monthlySessionsResult, attendanceResult, nextSessionResult] = await Promise.all([
        supabase
          .from('training_sessions')
          .select('id', { count: 'exact' })
          .gte('session_date', startOfMonth.toISOString().split('T')[0])
          .lte('session_date', endOfMonth.toISOString().split('T')[0]),
        supabase
          .from('training_attendance')
          .select('status'),
        supabase
          .from('training_sessions')
          .select('id, title, session_date, start_time')
          .gte('session_date', new Date().toISOString().split('T')[0])
          .order('session_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle()
      ]);

      const totalAttendance = attendanceResult.data?.length || 0;
      const presentCount = attendanceResult.data?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      return {
        monthlySessions: monthlySessionsResult.count || 0,
        attendanceRate: Math.round(attendanceRate),
        nextSession: nextSessionResult.data || null
      };
    }
  });
};

// Competition Statistics hooks
export const useCompetitionStats = () => {
  return useQuery({
    queryKey: ['competition-stats'],
    queryFn: async () => {
      const [championshipsResult, tournamentsResult, matchesResult, nextMatchResult] = await Promise.all([
        supabase.from('competitions').select('id', { count: 'exact' }).eq('type', 'championship').eq('is_active', true),
        supabase.from('competitions').select('id', { count: 'exact' }).eq('type', 'tournament').eq('is_active', true),
        supabase.from('matches').select('id', { count: 'exact' }),
        supabase
          .from('matches')
          .select('match_date, opponent_name')
          .gte('match_date', new Date().toISOString().split('T')[0])
          .order('match_date', { ascending: true })
          .limit(1)
          .maybeSingle()
      ]);

      let daysToNext = 0;
      if (nextMatchResult.data) {
        const nextDate = new Date(nextMatchResult.data.match_date);
        const today = new Date();
        daysToNext = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        championships: championshipsResult.count || 0,
        tournaments: tournamentsResult.count || 0,
        totalMatches: matchesResult.count || 0,
        daysToNext
      };
    }
  });
};

// Matches hooks
export const useMatches = () => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          competitions:competition_id(name)
        `)
        .order('match_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (match: {
      opponent_name: string;
      match_date: string;
      match_time: string;
      home_away?: string;
      location?: string;
      competition_id?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('matches')
        .insert([{ ...match, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({ title: "Partita creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante la creazione della partita", variant: "destructive" });
    }
  });
};

// Training Attendance hooks
export const useTrainingAttendance = (sessionId: string) => {
  return useQuery({
    queryKey: ['training-attendance', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_attendance')
        .select(`
          *,
          players:player_id(first_name, last_name)
        `)
        .eq('session_id', sessionId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (attendance: {
      session_id: string;
      player_id: string;
      status: string;
      arrival_time?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('training_attendance')
        .insert([attendance])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-attendance'] });
    }
  });
};

// Hook per aggiornare le statistiche dei giocatori
export const useUpdatePlayerStatistics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      // Prendi tutte le presenze per questa sessione
      const { data: attendance, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('player_id, status')
        .eq('session_id', sessionId);

      if (attendanceError) throw attendanceError;

      // Aggiorna le statistiche per ogni giocatore
      for (const record of attendance || []) {
        const { data: existingStats, error: statsError } = await supabase
          .from('player_statistics')
          .select('*')
          .eq('player_id', record.player_id)
          .maybeSingle();

        if (statsError) throw statsError;

        // Calcola le nuove statistiche basate su tutte le presenze del giocatore
        const { data: allAttendance, error: allAttendanceError } = await supabase
          .from('training_attendance')
          .select('status')
          .eq('player_id', record.player_id);

        if (allAttendanceError) throw allAttendanceError;

        const totalSessions = allAttendance?.length || 0;
        const presentSessions = allAttendance?.filter(a => a.status === 'present').length || 0;
        const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

        if (existingStats) {
          // Aggiorna statistiche esistenti
          const { error: updateError } = await supabase
            .from('player_statistics')
            .update({
              training_attendance_rate: attendanceRate,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStats.id);

          if (updateError) throw updateError;
        } else {
          // Crea nuove statistiche
          const { error: insertError } = await supabase
            .from('player_statistics')
            .insert({
              player_id: record.player_id,
              training_attendance_rate: attendanceRate,
              season: new Date().getFullYear().toString()
            });

          if (insertError) throw insertError;
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: ['player-statistics'] });
    }
  });
};

// Quick Trial Evaluation hooks
export const useQuickTrialEvaluations = (trialistId?: string, sessionId?: string) => {
  return useQuery({
    queryKey: ['quick-trial-evaluations', trialistId, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('quick_trial_evaluations')
        .select(`
          *,
          trialists (
            first_name,
            last_name,
            position,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (trialistId) {
        query = query.eq('trialist_id', trialistId);
      }
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!trialistId || !!sessionId
  });
};

export const useQuickTrialEvaluationsCount = (trialistId: string) => {
  return useQuery({
    queryKey: ['quick-trial-evaluations-count', trialistId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('quick_trial_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('trialist_id', trialistId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!trialistId
  });
};

export const useCreateQuickTrialEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      trialist_id: string;
      session_id?: string;
      personality_ratings?: number[];
      ability_ratings?: number[];
      flexibility_ratings?: number[];
      final_decision?: 'in_prova' | 'promosso' | 'archiviato';
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('quick_trial_evaluations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-trial-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['quick-trial-evaluations-count'] });
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
    }
  });
};

export const useUpdateQuickTrialEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      personality_ratings?: number[];
      ability_ratings?: number[];
      flexibility_ratings?: number[];
      final_decision?: 'in_prova' | 'promosso' | 'archiviato';
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('quick_trial_evaluations')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-trial-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['quick-trial-evaluations-count'] });
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
    }
  });
};

export const useDeleteQuickTrialEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evaluationId: string) => {
      const { error } = await supabase
        .from('quick_trial_evaluations')
        .delete()
        .eq('id', evaluationId);

      if (error) throw error;
      return evaluationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-trial-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['quick-trial-evaluations-count'] });
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
    }
  });
};

// Player evaluations hooks
export const usePlayerEvaluations = (playerId: string) => {
  return useQuery({
    queryKey: ['player-evaluations', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_evaluations')
        .select('*')
        .eq('player_id', playerId)
        .order('evaluation_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!playerId
  });
};

export const usePlayerEvaluationsCount = (playerId: string) => {
  return useQuery({
    queryKey: ['player-evaluations-count', playerId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('player_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', playerId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!playerId
  });
};

export const useUpdateTrialistStatusFromQuickEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { trialist_id: string; status: 'in_prova' | 'promosso' | 'archiviato' }) => {
      // Aggiorniamo lo status senza verifiche preliminari
      const { data: result, error } = await supabase
        .from('trialists')
        .update({ status: data.status })
        .eq('id', data.trialist_id)
        .select('id, status, first_name, last_name')
        .maybeSingle();
      
      if (error) {
        console.error('Errore aggiornamento trialist:', data.trialist_id, error);
        throw error;
      }
      
      if (!result) {
        throw new Error(`Trialist con ID ${data.trialist_id} non trovato`);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      queryClient.invalidateQueries({ queryKey: ['trialist-stats'] });
    }
  });
};
