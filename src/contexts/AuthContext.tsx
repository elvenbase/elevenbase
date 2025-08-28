
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
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
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
        try {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('*, teams(*)')
            .eq('user_id', data.user.id)
            .single();

          if (!teamMember) {
            await supabase.auth.signOut();
            const noTeamError = new Error("Non appartieni a nessuna squadra.");
            toast({ title: "Nessuna squadra", description: "Non appartieni a nessuna squadra. Contatta un amministratore.", variant: "destructive" });
            return { error: noTeamError };
          }

          const isOwner = teamMember.teams.owner_id === data.user.id;
          if (!isOwner && teamMember.status === 'pending') {
            await supabase.auth.signOut();
            const inactiveError = new Error("Account non attivo.");
            toast({ title: "Account non attivo", description: "Il tuo account non è ancora stato attivato. Contatta l'amministratore del team.", variant: "destructive" });
            return { error: inactiveError };
          }

          localStorage.setItem('currentTeamId', teamMember.team_id);
          localStorage.setItem('currentTeamName', teamMember.teams.name);
          localStorage.setItem('userRole', teamMember.role);
        } catch (err) {
          console.warn('Errore nel controllo del team:', err);
        }
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
      localStorage.removeItem('currentTeamId');
      localStorage.removeItem('currentTeamName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isGlobalAdmin');
    } catch (e) { void e }
  };

  const value = { user, session, loading, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
