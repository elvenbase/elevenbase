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
      // Generate public link token client-side to avoid DB default that may use missing gen_random_bytes
      let public_link_token = '';
      try {
        const bytes = new Uint8Array(16);
        // @ts-ignore
        (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => bytes[i] = Math.floor(Math.random() * 256));
        public_link_token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch {
        public_link_token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .insert([{ ...session, public_link_token, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();
      
      if (error) {
        const norm: any = new Error(error.message || 'Errore creazione sessione');
        norm.details = error.details;
        norm.hint = error.hint;
        norm.code = error.code;
        throw norm;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({ title: "Sessione di allenamento creata con successo" });
    },
    onError: (error: any) => {
      const desc = [
        error?.message && `Messaggio: ${error.message}`,
        error?.details && `Dettagli: ${error.details}`,
        error?.hint && `Hint: ${error.hint}`,
        error?.code && `Codice: ${error.code}`,
      ].filter(Boolean).join('\n');
      toast({ title: "Errore durante la creazione della sessione", description: desc || undefined, variant: "destructive" });
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
      const { data, error } = await supabase.from('trialists').select('*').order('last_name')
      if (error) throw error
      return data
    }
  })
}

export const useSetTrainingTrialistInvites = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, trialistIds }: { sessionId: string; trialistIds: string[] }) => {
      // delete existing then insert new set
      await supabase.from('training_trialist_invites').delete().eq('session_id', sessionId)
      if (trialistIds.length > 0) {
        const rows = trialistIds.map(id => ({ session_id: sessionId, trialist_id: id }))
        const { error } = await supabase.from('training_trialist_invites').insert(rows)
        if (error) throw error
      }
      return true
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['training-trialist-invites', vars.sessionId] })
      toast({ title: 'Inviti provinanti aggiornati' })
    },
    onError: (e: any) => toast({ title: 'Errore aggiornando inviti', description: e?.message, variant: 'destructive' })
  })
}

export const useSetMatchTrialistInvites = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ matchId, trialistIds }: { matchId: string; trialistIds: string[] }) => {
      await supabase.from('match_trialist_invites').delete().eq('match_id', matchId)
      if (trialistIds.length > 0) {
        const rows = trialistIds.map(id => ({ match_id: matchId, trialist_id: id }))
        const { error } = await supabase.from('match_trialist_invites').insert(rows)
        if (error) throw error
      }
      return true
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['match-trialist-invites', vars.matchId] })
      toast({ title: 'Inviti provinanti aggiornati' })
    },
    onError: (e: any) => toast({ title: 'Errore aggiornando inviti', description: e?.message, variant: 'destructive' })
  })
}

// Trialist invites readers/updaters
export const useTrainingTrialistInvites = (sessionId: string) => {
  return useQuery({
    queryKey: ['training-trialist-invites', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_trialist_invites')
        .select('*, trialists:trialist_id(id,first_name,last_name,role_code)')
        .eq('session_id', sessionId)
      if (error) throw error
      return data || []
    },
    enabled: !!sessionId
  })
}

export const useUpdateTrainingTrialistInvite = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ session_id, trialist_id, status }: { session_id: string; trialist_id: string; status: 'present'|'absent'|'pending'|'uncertain' }) => {
      const { error } = await supabase
        .from('training_trialist_invites')
        .upsert({ session_id, trialist_id, status }, { onConflict: 'session_id,trialist_id' })
      if (error) throw error
      return true
    },
    onSuccess: (_r, v) => {
      queryClient.invalidateQueries({ queryKey: ['training-trialist-invites', v.session_id] })
      toast({ title: 'Stato provinante aggiornato' })
    },
    onError: (e: any) => toast({ title: 'Errore aggiornando provinante', description: e?.message, variant: 'destructive' })
  })
}

export const useMatchTrialistInvites = (matchId: string) => {
  return useQuery({
    queryKey: ['match-trialist-invites', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_trialist_invites')
        .select('*, trialists:trialist_id(id,first_name,last_name,role_code)')
        .eq('match_id', matchId)
      if (error) throw error
      return data || []
    },
    enabled: !!matchId
  })
}

export const useUpdateMatchTrialistInvite = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ match_id, trialist_id, status }: { match_id: string; trialist_id: string; status: 'present'|'absent'|'pending'|'uncertain' }) => {
      const { error } = await supabase
        .from('match_trialist_invites')
        .upsert({ match_id, trialist_id, status }, { onConflict: 'match_id,trialist_id' })
      if (error) throw error
      return true
    },
    onSuccess: (_r, v) => {
      queryClient.invalidateQueries({ queryKey: ['match-trialist-invites', v.match_id] })
      toast({ title: 'Stato provinante aggiornato' })
    },
    onError: (e: any) => toast({ title: 'Errore aggiornando provinante', description: e?.message, variant: 'destructive' })
  })
}

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
export const useAvailableJerseyNumbers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['available-jersey-numbers'],
    enabled,
    queryFn: async () => {
      try {
        const { data: players, error } = await supabase
          .from('players')
          .select('jersey_number')
          .not('jersey_number', 'is', null);

        if (error) {
          console.error('Error fetching jersey numbers:', error);
          throw error;
        }

        const usedNumbers = new Set((players || []).map(p => p.jersey_number));
        const availableNumbers = [];
        
        for (let i = 0; i <= 99; i++) {
          if (!usedNumbers.has(i)) {
            availableNumbers.push(i);
          }
        }
        
        return availableNumbers;
      } catch (error) {
        console.error('Error in useAvailableJerseyNumbers:', error);
        // Return a fallback list in case of error
        return Array.from({ length: 100 }, (_, i) => i);
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
export const useMatch = (matchId: string) => {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, opponents:opponent_id(name, logo_url, jersey_shape, jersey_primary_color, jersey_secondary_color, jersey_accent_color, jersey_image_url)')
        .eq('id', matchId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!matchId
  })
}

export const useMatches = () => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, opponents:opponent_id(name, logo_url, jersey_template_id, jersey_shape, jersey_primary_color, jersey_secondary_color, jersey_accent_color, jersey_image_url)')
        .order('match_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useMatchEvents = (matchId: string) => {
  return useQuery({
    queryKey: ['match-events', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_events')
        .select(`*, players:player_id(first_name,last_name), trialists:trialist_id(id,first_name,last_name)`).eq('match_id', matchId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!matchId
  })
}

export const useUpdateMatch = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ opponent_name: string; match_date: string; match_time: string; home_away: 'home'|'away'; location?: string|null; competition_id?: string|null; notes?: string|null; allow_trialists?: boolean }> }) => {
      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['match', data.id] })
      toast({ title: 'Partita aggiornata' })
    },
    onError: (e: any) => {
      toast({ title: 'Errore aggiornamento partita', description: e?.message, variant: 'destructive' })
    }
  })
}

export const useCreateMatchEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (evt: { match_id: string; team: 'us'|'opponent'; event_type: string; player_id?: string|null; assister_id?: string|null; comment?: string|null }) => {
      const { data, error } = await supabase.from('match_events').insert(evt).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-events', variables.match_id] })
    }
  })
}

export const useCreateMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (match: {
      opponent_name: string;
      match_date: string;
      match_time: string;
      home_away?: string;
      competition_id?: string;
      notes?: string;
      opponent_logo_url?: string;
    }) => {
      // Ensure opponent exists (by name), optionally setting logo_url, then attach opponent_id
      const opponentName = (match.opponent_name || '').trim()
      let opponent_id: string | undefined = undefined
      if (opponentName) {
        const lower = opponentName.toLowerCase()
        const { data: existing } = await supabase.from('opponents').select('id, logo_url').ilike('name', lower)
        if (existing && existing.length > 0) {
          opponent_id = existing[0].id
          // Optionally update logo if provided and missing
          if (match.opponent_logo_url && !existing[0].logo_url) {
            await supabase.from('opponents').update({ logo_url: match.opponent_logo_url }).eq('id', opponent_id)
          }
        } else {
          const { data: inserted, error: oppErr } = await supabase.from('opponents').insert({ name: opponentName, logo_url: match.opponent_logo_url || null }).select().single()
          if (oppErr) throw oppErr
          opponent_id = inserted?.id
        }
      }

      const payload: any = { ...match, opponent_logo_url: undefined, opponent_id, created_by: (await supabase.auth.getUser()).data.user?.id }
      const { data, error } = await supabase
        .from('matches')
        .insert([payload])
        .select()
        .single();
       
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({ title: "Partita creata con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore durante la creazione della partita", description: error?.message, variant: "destructive" });
    }
  });
};

export const useOpponents = () => {
  return useQuery({
    queryKey: ['opponents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('opponents').select('*').order('name', { ascending: true })
      if (error) throw error
      return data
    }
  })
}

export const useCreateOpponent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (payload: { name: string; logo_url?: string|null; jersey_template_id?: string|null }) => {
      const { data, error } = await supabase.from('opponents').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opponents'] })
      toast({ title: 'Avversario creato' })
    },
    onError: (e: any) => toast({ title: 'Errore creazione avversario', description: e?.message, variant: 'destructive' })
  })
}

export const useUpdateOpponent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { data: res, error } = await supabase.from('opponents').update(data).eq('id', id).select().single()
      if (error) throw error
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opponents'] })
      toast({ title: 'Avversario aggiornato' })
    },
    onError: (e: any) => toast({ title: 'Errore aggiornamento avversario', description: e?.message, variant: 'destructive' })
  })
}

export const useDeleteOpponent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opponents').delete().eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opponents'] })
      toast({ title: 'Avversario eliminato' })
    },
    onError: (e: any) => toast({ title: 'Errore eliminazione avversario', description: e?.message, variant: 'destructive' })
  })
}

export const useDeleteMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.from('matches').delete().eq('id', matchId)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      toast({ title: 'Partita eliminata' })
    },
    onError: (e: any) => toast({ title: 'Errore eliminazione partita', description: e?.message, variant: 'destructive' })
  })
}

export const useCloneMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (matchId: string) => {
      // fetch match
      const { data: m, error } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle()
      if (error) throw error
      if (!m) throw new Error('Match not found')
      // insert clone (shift date +7 days as default)
      const originalDate = new Date(m.match_date)
      originalDate.setDate(originalDate.getDate() + 7)
      const y = originalDate.getFullYear(); const mo = String(originalDate.getMonth()+1).padStart(2,'0'); const d = String(originalDate.getDate()).padStart(2,'0')
      const newDate = `${y}-${mo}-${d}`
      const insert = {
        opponent_name: m.opponent_name,
        match_date: newDate,
        match_time: m.match_time,
        home_away: m.home_away,
        location: m.location,
        competition_id: m.competition_id,
        notes: m.notes
      }
      const { data: inserted, error: insErr } = await supabase.from('matches').insert(insert).select().single()
      if (insErr) throw insErr
      // clone lineup if exists
      const { data: lineup } = await supabase.from('match_lineups').select('*').eq('match_id', matchId).maybeSingle()
      if (lineup) {
        await supabase.from('match_lineups').insert({ match_id: inserted.id, formation: lineup.formation, players_data: lineup.players_data })
      }
      // clone bench if exists
      const { data: bench } = await supabase.from('match_bench').select('player_id, notes').eq('match_id', matchId)
      if (bench && bench.length > 0) {
        const rows = bench.map(b => ({ match_id: inserted.id, player_id: b.player_id, notes: b.notes }))
        await supabase.from('match_bench').insert(rows)
      }
      return inserted
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      toast({ title: 'Partita clonata' })
    },
    onError: (e: any) => toast({ title: 'Errore clonazione partita', description: e?.message, variant: 'destructive' })
  })
}

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
    mutationFn: async ({ records }: { records: Array<{ player_id: string; attendanceRate: number }> }) => {
      for (const record of records) {
        const attendanceRate = record.attendanceRate;
        const { data: existingStats, error: fetchError } = await supabase
          .from('player_statistics')
          .select('*')
          .eq('player_id', record.player_id)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existingStats) {
          const { error: updateError } = await supabase
            .from('player_statistics')
            .update({ training_attendance_rate: attendanceRate })
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

export const useMatchAttendance = (matchId: string) => {
  return useQuery({
    queryKey: ['match-attendance', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_attendance')
        .select(`*, players:player_id(first_name,last_name,avatar_url,jersey_number)`) 
        .eq('match_id', matchId)
      if (error) throw error
      return data || []
    },
    enabled: !!matchId
  })
}

export const useUpsertMatchAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { match_id: string; player_id: string; status?: string; coach_confirmation_status?: string; self_registered?: boolean; arrival_time?: string | null; notes?: string | null }) => {
      const { data, error } = await supabase
        .from('match_attendance')
        .upsert(payload, { onConflict: 'match_id,player_id' })
        .select()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-attendance', variables.match_id] })
    }
  })
}

export const useBulkUpdateMatchAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { match_id: string; player_ids: string[]; status: string }) => {
      const updates = payload.player_ids.map((player_id) => ({ match_id: payload.match_id, player_id, status: payload.status }))
      const { error } = await supabase.from('match_attendance').upsert(updates, { onConflict: 'match_id,player_id' })
      if (error) throw error
      return true
    },
    onSuccess: (_ok, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-attendance', variables.match_id] })
    }
  })
}

export const useEnsureMatchPublicSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const updates: any = {}
      // fetch match
      const { data: match, error } = await supabase.from('matches').select('public_link_token, allow_responses_until, match_date, match_time').eq('id', matchId).maybeSingle()
      if (error) throw error
      if (!match) throw new Error('Match not found')
      if (!match.public_link_token) updates.public_link_token = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
      if (!match.allow_responses_until && match.match_date && match.match_time) {
        const start = new Date(`${match.match_date}T${match.match_time}`)
        start.setHours(start.getHours() - 2)
        updates.allow_responses_until = start.toISOString()
      }
      if (Object.keys(updates).length === 0) return match
      const { data: updated, error: upErr } = await supabase.from('matches').update(updates).eq('id', matchId).select().single()
      if (upErr) throw upErr
      return updated
    },
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    }
  })
}

export const useFinalizeMatch = () => {
  return useMutation({
    mutationFn: async ({ matchId, ourScore, opponentScore }: { matchId: string; ourScore: number; opponentScore: number }) => {
      const { error } = await supabase.from('matches').update({ live_state: 'ended', our_score: ourScore, opponent_score: opponentScore }).eq('id', matchId)
      if (error) throw error
      return true
    }
  })
}

export const useUpsertMatchPlayerStats = () => {
  return useMutation({
    mutationFn: async ({ rows }: { rows: Array<any> }) => {
      const tryUpsert = async (batch: any[], conflict: 'match_id,player_id' | 'match_id,trialist_id') => {
        if (batch.length === 0) return
        const { error } = await supabase.from('match_player_stats').upsert(batch, { onConflict: conflict as any })
        if (error) {
          // Fallback for environments missing proper UNIQUE CONSTRAINTS (42P10)
          const code = (error as any).code || (error as any)?.details || ''
          if (String(code).includes('42P10') || /no unique|ON CONFLICT/.test(String((error as any).message || ''))) {
            for (const rec of batch) {
              const isPlayer = !!rec.player_id
              const eqs = isPlayer
                ? { match_id: rec.match_id, player_id: rec.player_id }
                : { match_id: rec.match_id, trialist_id: rec.trialist_id }
              const { data: existing, error: selErr } = await supabase
                .from('match_player_stats')
                .select('id')
                .match(eqs as any)
                .maybeSingle()
              if (selErr) throw selErr
              if (existing) {
                const { error: updErr } = await supabase
                  .from('match_player_stats')
                  .update({ ...rec })
                  .eq('id', (existing as any).id)
                if (updErr) throw updErr
              } else {
                const { error: insErr } = await supabase
                  .from('match_player_stats')
                  .insert(rec)
                if (insErr) throw insErr
              }
            }
          } else {
            throw error
          }
        }
      }

      const playerRows = rows.filter(r => !!r.player_id)
      const trialistRows = rows.filter(r => !!r.trialist_id)

      await tryUpsert(playerRows, 'match_id,player_id')
      await tryUpsert(trialistRows, 'match_id,trialist_id')
      return true
    }
  })
}

export const usePlayerAttendanceSummary = (playerId: string) => {
  return useQuery({
    queryKey: ['player-attendance-summary', playerId],
    queryFn: async () => {
      const [trRes, mtRes] = await Promise.all([
        supabase.from('training_attendance').select('status, arrival_time').eq('player_id', playerId),
        supabase.from('match_attendance').select('status').eq('player_id', playerId)
      ])
      if (trRes.error) throw trRes.error
      if (mtRes.error) throw mtRes.error
      const training = trRes.data || []
      const matches = mtRes.data || []
      const trainingPresent = training.filter(t => t.status === 'present').length
      const trainingTardy = training.filter(t => t.status === 'present' && t.arrival_time !== null).length
      const matchPresent = matches.filter(m => m.status === 'present').length
      const matchTardy = matches.filter(m => m.status === 'late').length
      const totalEvents = training.length + matches.length
      const totalPresences = trainingPresent + matchPresent
      const totalTardiness = trainingTardy + matchTardy
      const attendanceRate = totalEvents > 0 ? Math.round((totalPresences / totalEvents) * 100) : 0
      return {
        training: { present: trainingPresent, tardy: trainingTardy, total: training.length },
        match: { present: matchPresent, tardy: matchTardy, total: matches.length },
        totals: { present: totalPresences, tardy: totalTardiness, total: totalEvents, attendanceRate }
      }
    },
    enabled: !!playerId
  })
}

export const useMatchEventsRaw = (matchId: string) => {
  return useQuery({
    queryKey: ['match-events-raw', matchId],
    queryFn: async () => {
      const { data, error } = await supabase.from('match_events').select('*').eq('match_id', matchId).order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!matchId
  })
}

export const usePlayerMatchStats = (playerId: string) => {
  return useQuery({
    queryKey: ['player-match-stats', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_player_stats')
        .select(`
          id, match_id, player_id, started, minutes, goals, assists, yellow_cards, red_cards, fouls_committed, saves, sub_in_minute, sub_out_minute, was_in_squad,
          matches:match_id(id, match_date, match_time, opponent_name, our_score, opponent_score, opponent_id,
            opponents:opponent_id(name, logo_url)
          )
        `)
        .eq('player_id', playerId)
        .order('match_id', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!playerId
  })
}

export const usePlayerById = (playerId: string) => {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!playerId
  })
}

export const useFormerTrialistData = (player: any) => {
  return useQuery({
    queryKey: ['former-trialist', player?.email || player?.first_name || '', player?.last_name || ''],
    queryFn: async () => {
      if (!player) return null
      // Try match by email first
      if (player.email) {
        const { data: tByEmail } = await supabase.from('trialists').select('*, trial_evaluations:trial_evaluations(*)').eq('email', player.email).order('created_at', { ascending: false })
        if (tByEmail && tByEmail.length > 0) return tByEmail[0]
      }
      // Fallback: by name (best effort)
      const { data: tByName } = await supabase.from('trialists').select('*, trial_evaluations:trial_evaluations(*)')
        .ilike('first_name', player.first_name || '')
        .ilike('last_name', player.last_name || '')
        .order('created_at', { ascending: false })
      return (tByName && tByName.length > 0) ? tByName[0] : null
    },
    enabled: !!player
  })
}
