
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Verifica se l'utente è attivo
      if (data.user) {

        
        try {
          const { data: isActive, error: statusError } = await supabase.rpc('is_user_active', {
            _user_id: data.user.id
          });

          if (statusError) {
            console.warn('Errore nel controllo dello status, permettendo login:', statusError);
            // Se c'è un errore nel controllo status, permettiamo il login comunque
          } else if (!isActive) {
            // Fai logout immediato se l'utente non è attivo
            await supabase.auth.signOut();
            const inactiveError = new Error("Account non attivo. Contatta l'amministratore.");
            toast({
              title: "Account non attivo",
              description: "Il tuo account non è ancora stato attivato. Contatta l'amministratore.",
              variant: "destructive",
            });
            return { error: inactiveError };
          }
        } catch (statusErr) {
          console.warn('Errore nel controllo dello status, permettendo login:', statusErr);
          // Se c'è un errore, permettiamo comunque il login
        }
      }
      
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Errore di accesso",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });
      
      if (error) {
        toast({
          title: "Errore di registrazione",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registrazione completata",
          description: "Controlla la tua email per confermare l'account",
        });
      }
      
      return { error };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Errore di registrazione",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Errore",
        description: "Errore durante il logout",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
