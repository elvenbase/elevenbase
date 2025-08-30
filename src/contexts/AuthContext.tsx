
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationStatus {
  registered: boolean;
  has_team: boolean;
  is_superadmin: boolean;
  team_id?: string;
  team_name?: string;
  team_abbreviation?: string;
  team_logo_url?: string; // ✅ Aggiunto logo URL
  role?: 'founder' | 'admin' | 'player';
  status?: 'pending' | 'active' | 'suspended';
  ea_sports_id?: string;
  can_login: boolean;
  needs_registration?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  registrationStatus: RegistrationStatus | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshRegistrationStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const { toast } = useToast();

  // Funzione per aggiornare lo status di registrazione
  const refreshRegistrationStatus = async (targetUser?: User) => {
    const currentUser = targetUser || user || session?.user;
    if (!currentUser) {

      setRegistrationStatus(null);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_registration_status', {
        _user_id: currentUser.id
      });

      if (error) {
        console.error('Errore nel caricamento status registrazione:', error);
        setRegistrationStatus(null);
        return;
      }

      // ✅ Se abbiamo team_id, carichiamo anche il logo
      if (data?.team_id) {
        try {
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('logo_url')
            .eq('id', data.team_id)
            .single();
            
          if (!teamError && teamData?.logo_url) {
            data.team_logo_url = teamData.logo_url;
          }
        } catch (logoError) {
          console.warn('Could not load team logo:', logoError);
        }
      }

      setRegistrationStatus(data);

      // Aggiorna localStorage per compatibilità
      if (data?.team_id) {
        localStorage.setItem('currentTeamId', data.team_id);
        localStorage.setItem('currentTeamName', data.team_name || '');
        localStorage.setItem('userRole', data.role || '');
        localStorage.setItem('isGlobalAdmin', data.is_superadmin ? 'true' : 'false');
        
        // ✅ Trigger logo update per Navigation
        localStorage.setItem('teamDataUpdatedAt', Date.now().toString());
      } else {
        localStorage.removeItem('currentTeamId');
        localStorage.removeItem('currentTeamName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isGlobalAdmin');
        
        // ✅ Trigger logo reset per Navigation
        localStorage.setItem('teamDataUpdatedAt', Date.now().toString());
      }
    } catch (err) {
      console.error('Errore nel refresh status:', err);
      setRegistrationStatus(null);
    }
  };

  useEffect(() => {
    // Inizializza con la sessione corrente
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshRegistrationStatus(session.user);
      } else {
        setRegistrationStatus(null);
      }
      
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await refreshRegistrationStatus();
          setLoading(false); // ✅ Spostato dopo refreshRegistrationStatus
        } else {
          setRegistrationStatus(null);
          setLoading(false); // ✅ Anche qui dopo setRegistrationStatus
        }
      }
    );



    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Errore di accesso", description: error.message, variant: "destructive" });
        return { error };
      }

      if (data.user) {
        // Ottieni lo status di registrazione
        const { data: status, error: statusError } = await supabase.rpc('get_user_registration_status', {
          _user_id: data.user.id
        });

        if (statusError) {
          console.error('Errore nel controllo status:', statusError);
          // Continua comunque per superadmin
        }

        // Verifica se può effettuare il login
        if (status && !status.can_login) {
          // Solo per needs_registration facciamo sign out
          if (status.needs_registration) {
            await supabase.auth.signOut();
            const noTeamError = new Error("Registrazione incompleta");
            toast({ 
              title: "Registrazione incompleta", 
              description: "Devi completare la registrazione. Verrai reindirizzato.", 
              variant: "destructive" 
            });
            return { error: noTeamError };
          } 
          // Per pending, permettiamo login ma settiamo flag per reindirizzamento
          else if (status.status === 'pending') {
            toast({ 
              title: "🕐 Account in attesa", 
              description: "Reindirizzamento alla pagina di attesa approvazione...", 
              variant: "default" 
            });
            // Non facciamo signOut per pending - permettiamo l'accesso limitato
            return { data, isPending: true };
          } else {
            const genericError = new Error("Accesso non autorizzato");
            toast({ 
              title: "Accesso negato", 
              description: "Non sei autorizzato ad accedere. Contatta l'amministratore.", 
              variant: "destructive" 
            });
            return { error: genericError };
          }
        }

        // Login riuscito - il refresh status avverrà automaticamente tramite onAuthStateChange
        toast({ 
          title: "Accesso riuscito", 
          description: `Benvenuto${status?.team_name ? ` in ${status.team_name}` : ''}!` 
        });
      }
      
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({ title: "Errore di accesso", description: "Si è verificato un errore imprevisto", variant: "destructive" });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      // Reindirizza esplicitamente alla pagina di conferma per gestire cleanup sessione
      const redirectUrl = `${window.location.origin}/confirm?type=signup`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { username } }
      });
      if (error) {
        toast({ title: "Errore di registrazione", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Registrazione completata", description: "Controlla la tua email per confermare l'account" });
      }
      return { error };
    } catch (err) {
      const error = err as Error;
      toast({ title: "Errore di registrazione", description: "Si è verificato un errore imprevisto", variant: "destructive" });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const strategies = [
        { name: 'Standard logout', options: undefined },
        { name: 'Local logout', options: { scope: 'local' as const } },
        { name: 'Global logout', options: { scope: 'global' as const } }
      ];
      for (let i = 0; i < strategies.length; i++) {
        try { await supabase.auth.signOut(strategies[i].options); break; } catch (e) { void e }
      }
      
      // Pulisci tutti i dati locali
      localStorage.removeItem('currentTeamId');
      localStorage.removeItem('currentTeamName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isGlobalAdmin');
      
      // Reset registration status
      setRegistrationStatus(null);
    } catch (e) { void e }
  };

  const value = { 
    user, 
    session, 
    loading, 
    registrationStatus,
    signIn, 
    signUp, 
    signOut,
    refreshRegistrationStatus
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
