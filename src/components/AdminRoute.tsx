import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        // Global admin bypass (email-based, set at login)
        if (typeof window !== 'undefined' && localStorage.getItem('isGlobalAdmin') === 'true') {
          setIsAdmin(true);
          return;
        }

        // 1) Superadmin globale: bypassa controllo team
        const { data: isSuperAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'superadmin',
        });
        if (isSuperAdmin) {
          setIsAdmin(true);
          return;
        }

        // 2) Admin di team o Founder (owner): verifica permesso/ownership sul team corrente
        let teamId: string | null = null;
        if (typeof window !== 'undefined') {
          teamId = localStorage.getItem('currentTeamId');
        }

        // Se non presente in localStorage, trova un team attivo dell'utente
        if (!teamId) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('team_id, role, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
          teamId = teamMember?.team_id ?? null;
        }

        if (!teamId) {
          setIsAdmin(false);
          return;
        }

        // Founder: owner ha poteri equivalenti
        const { data: teamData } = await supabase
          .from('teams')
          .select('owner_id')
          .eq('id', teamId)
          .maybeSingle();
        if (teamData?.owner_id && teamData.owner_id === user.id) {
          setIsAdmin(true);
          return;
        }

        const { data: hasManageTeamPermission } = await supabase.rpc('has_team_permission', {
          _team_id: teamId,
          _permission: 'manage_team',
        });

        setIsAdmin(Boolean(hasManageTeamPermission));
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Accesso Negato</h1>
          <p className="text-muted-foreground mb-4">
            Non hai i permessi necessari per accedere a questa sezione.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;