import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, registrationStatus } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) { 
        setIsAdmin(false); 
        return; 
      }

      // Usa il registration status se disponibile
      if (registrationStatus) {
        console.log('🔍 AdminRoute - registrationStatus:', registrationStatus);
        
        const hasAdminAccess = (
          registrationStatus.is_superadmin || 
          registrationStatus.role === 'founder' || 
          registrationStatus.role === 'admin'
        ) && (
          registrationStatus.status === 'active' || registrationStatus.is_superadmin
        );
        
        console.log('🔑 AdminRoute - hasAdminAccess:', hasAdminAccess, {
          is_superadmin: registrationStatus.is_superadmin,
          role: registrationStatus.role,
          status: registrationStatus.status
        });
        
        setIsAdmin(hasAdminAccess);
        return;
      }

      // Fallback: controllo diretto (per compatibilità)
      try {
        // Verifica superadmin
        const { data: isSuperAdmin } = await supabase.rpc('is_superadmin', { _user_id: user.id });
        if (isSuperAdmin) { 
          setIsAdmin(true); 
          return; 
        }

        // Verifica founder/admin del team corrente
        const teamId = localStorage.getItem('currentTeamId');
        if (teamId) {
          const { data: canManage } = await supabase.rpc('can_manage_team', { 
            _team_id: teamId, 
            _user_id: user.id 
          });
          setIsAdmin(Boolean(canManage));
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Errore nel controllo permessi admin:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, registrationStatus]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Accesso Negato</h1>
          <p className="text-muted-foreground mb-4">
            Non hai i permessi necessari per accedere a questa sezione.
            {registrationStatus?.status === 'pending' && (
              <span className="block mt-2 text-orange-600">
                Il tuo account è in attesa di approvazione.
              </span>
            )}
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