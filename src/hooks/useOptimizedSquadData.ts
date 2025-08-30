import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook ottimizzato per caricare prima i players base, poi le statistiche
export const useOptimizedPlayersBase = () => {
  return useQuery({
    queryKey: ['players-base', localStorage.getItem('currentTeamId')],
    staleTime: 5 * 60 * 1000, // 5 minuti di cache per dati base
    gcTime: 10 * 60 * 1000, // 10 minuti prima di garbage collection
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Get current team from localStorage
      let currentTeamId = localStorage.getItem('currentTeamId');
      
      // If no team in localStorage, try to get it from the user's team membership
      if (!currentTeamId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('team_id, role, teams(name, owner_id)')
            .eq('user_id', user.id)
            .single();
          
          if (teamMember) {
            currentTeamId = teamMember.team_id;
            localStorage.setItem('currentTeamId', currentTeamId);
            localStorage.setItem('currentTeamName', teamMember.teams?.name || 'Team');
            localStorage.setItem('userRole', teamMember.role || 'member');
          }
        }
      }
      
      // Build query with team filter - SOLO dati essenziali
      let query = supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, status, avatar_url, birth_date, phone, email, is_captain, role_code, team_id');
      
      // Filter by team if we have a team ID
      if (currentTeamId) {
        query = query.eq('team_id', currentTeamId);
      }
      
      // Exclude guest players
      const isGuestSupported = true; // Assume supported for optimization
      if (isGuestSupported) {
        query = query.eq('is_guest', false);
      }
      
      const { data: players, error: playersError } = await query.order('last_name');
      
      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw playersError;
      }

      // Return players with default stats (will be updated by attendance hook)
      return players.map(player => ({
        ...player,
        presences: 0,
        tardiness: 0,
        totalEvents: 0,
        attendanceRate: 0,
        trainingPresences: 0,
        trainingTardiness: 0,
        trainingTotal: 0,
        matchPresences: 0,
        matchTardiness: 0,
        matchEndedTotal: 0,
      }));
    },
  });
};