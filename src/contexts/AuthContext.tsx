
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
  const refreshRegistrationStatus = async () => {
    const currentUser = user || session?.user;
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

      setRegistrationStatus(data);

      // Aggiorna localStorage per compatibilità
      if (data?.team_id) {
        localStorage.setItem('currentTeamId', data.team_id);
        localStorage.setItem('currentTeamName', data.team_name || '');
        localStorage.setItem('userRole', data.role || '');
        localStorage.setItem('isGlobalAdmin', data.is_superadmin ? 'true' : 'false');
      } else {
        localStorage.removeItem('currentTeamId');
        localStorage.removeItem('currentTeamName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isGlobalAdmin');
      }
    } catch (err) {
      console.error('Errore nel refresh status:', err);
      setRegistrationStatus(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await refreshRegistrationStatus();
        } else {
          setRegistrationStatus(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshRegistrationStatus();
      }
      
      setLoading(false);
    });

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
          await supabase.auth.signOut();
          
          if (status.needs_registration) {
            const noTeamError = new Error("Registrazione incompleta");
            toast({ 
              title: "Registrazione incompleta", 
              description: "Devi completare la registrazione. Verrai reindirizzato.", 
              variant: "destructive" 
            });
            // Qui potresti reindirizzare alla pagina di registrazione
            return { error: noTeamError };
          } else if (status.status === 'pending') {
            const pendingError = new Error("Account in attesa di approvazione");
            toast({ 
              title: "Account non attivo", 
              description: "Il tuo account è in attesa di approvazione dal team. Contatta l'amministratore.", 
              variant: "destructive" 
            });
            return { error: pendingError };
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
