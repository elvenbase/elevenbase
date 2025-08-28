import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EmailConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Best-effort event logger: ignora errori se tabella/policy non disponibili
  const logConfirmEvent = async (params: {
    outcome: 'privileged' | 'non_privileged' | 'error';
    source: 'access_token' | 'verify_otp' | 'hash_listener';
    note?: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;
      await supabase.from('app_events').insert({
        event_type: 'email_confirm',
        source: params.source,
        outcome: params.outcome,
        note: params.note ?? null,
        user_id: userId,
        created_at: new Date().toISOString(),
        metadata: { location: window.location.href }
      } as any);
    } catch { /* no-op */ }
  };

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const tokenHash = searchParams.get('token_hash');

        // Controlla anche l'hash fragment per access_token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');

        const allowSessionForPrivilegedUser = async (): Promise<boolean> => {
          try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            if (!userId) return false;

            // Superadmin globale
            const { data: isSuperAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'superadmin' });
            if (isSuperAdmin) return true;

            // Owner di almeno un team
            const { data: ownedTeam } = await supabase
              .from('teams')
              .select('id')
              .eq('owner_id', userId)
              .limit(1)
              .maybeSingle();
            if (ownedTeam?.id) return true;

            // Admin/coach attivo in almeno un team
            const { data: membership } = await supabase
              .from('team_members')
              .select('role,status')
              .eq('user_id', userId)
              .eq('status', 'active')
              .in('role', ['admin', 'coach'])
              .limit(1)
              .maybeSingle();
            if (membership?.role) return true;

            return false;
          } catch {
            return false;
          }
        };

        // Se abbiamo un access_token (da query params o hash), Supabase ha creato una sessione
        // Mantieni la sessione SOLO per superadmin/owner/admin attivi; per gli altri fai signOut
        if (accessToken || hashAccessToken) {
          const isPrivileged = await allowSessionForPrivilegedUser();
          if (!isPrivileged) {
            void logConfirmEvent({ outcome: 'non_privileged', source: 'access_token' });
            try { await supabase.auth.signOut({ scope: 'global' as const }); } catch { /* no-op */ }
            setStatus('success');
            setMessage('Email confermata con successo! Ora puoi accedere dal login.');
            return;
          }
          void logConfirmEvent({ outcome: 'privileged', source: 'access_token' });
          setStatus('success');
          setMessage('Email confermata con successo! Benvenuto.');
          return;
        }

        // Se abbiamo un token_hash, usiamo quello
        const tokenToUse = tokenHash || token;

        if (!tokenToUse) {
          setStatus('error');
          setMessage('Token di conferma mancante');
          return;
        }

        if (type === 'signup') {
          // Conferma registrazione
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenToUse,
            type: 'signup'
          });

          if (error) {
            console.error('Errore conferma email:', error);
            void logConfirmEvent({ outcome: 'error', source: 'verify_otp', note: 'verifyOtp error' });
            setStatus('error');
            setMessage('Link di conferma scaduto o non valido. Richiedi una nuova email di conferma.');
            return;
          }

          // Dopo verifyOtp, potrebbe essere stata creata una sessione: mantienila solo per utenti privilegiati
          const isPrivileged = await allowSessionForPrivilegedUser();
          if (!isPrivileged) {
            void logConfirmEvent({ outcome: 'non_privileged', source: 'verify_otp' });
            try { await supabase.auth.signOut({ scope: 'global' as const }); } catch { /* no-op */ }
            setStatus('success');
            setMessage('Email confermata con successo! Ora puoi accedere dal login.');
          } else {
            void logConfirmEvent({ outcome: 'privileged', source: 'verify_otp' });
            setStatus('success');
            setMessage('Email confermata con successo! Benvenuto.');
          }
        } else if (type === 'recovery') {
          // Reset password
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });

          if (error) {
            console.error('Errore reset password:', error);
            setStatus('error');
            setMessage('Errore durante il reset della password. Riprova.');
            return;
          }

          setStatus('success');
          setMessage('Password resettata con successo! Ora puoi accedere con la nuova password.');
        } else {
          setStatus('error');
          setMessage('Tipo di conferma non valido');
        }
      } catch (error) {
        console.error('Errore conferma:', error);
        setStatus('error');
        setMessage('Errore imprevisto durante la conferma');
      }
    };

    confirmEmail();
  }, [searchParams]);

  // Listener per cambiamenti nell'hash
  useEffect(() => {
    const handleHashChange = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashAccessToken = hashParams.get('access_token');
      
      if (hashAccessToken) {
        (async () => {
          const isPrivileged = await (async () => {
            try {
              const { data: userData } = await supabase.auth.getUser();
              const userId = userData?.user?.id;
              if (!userId) return false;
              const { data: isSuperAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'superadmin' });
              if (isSuperAdmin) return true;
              const { data: ownedTeam } = await supabase.from('teams').select('id').eq('owner_id', userId).limit(1).maybeSingle();
              if (ownedTeam?.id) return true;
              const { data: membership } = await supabase
                .from('team_members')
                .select('role,status')
                .eq('user_id', userId)
                .eq('status', 'active')
                .in('role', ['admin', 'coach'])
                .limit(1)
                .maybeSingle();
              return Boolean(membership?.role);
            } catch { return false; }
          })();
          if (!isPrivileged) {
            void logConfirmEvent({ outcome: 'non_privileged', source: 'hash_listener' });
            try { await supabase.auth.signOut({ scope: 'global' as const }); } catch { /* no-op */ }
            setStatus('success');
            setMessage('Email confermata con successo! Ora puoi accedere dal login.');
          } else {
            void logConfirmEvent({ outcome: 'privileged', source: 'hash_listener' });
            setStatus('success');
            setMessage('Email confermata con successo! Benvenuto.');
          }
        })();
      }
    };

    // Controlla immediatamente se c'è già un hash
    handleHashChange();

    // Aggiungi listener per cambiamenti nell'hash
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleContinue = () => {
    navigate('/auth');
  };

  const handleResendEmail = async () => {
    try {
      setStatus('loading');
      setMessage('Invio nuova email di conferma...');
      
      // Richiedi una nuova email di conferma
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: 'a.camolese@gmail.com' // Email hardcoded per ora
      });

      if (error) {
        console.error('Errore invio email:', error);
        setStatus('error');
        setMessage('Errore nell\'invio della nuova email. Riprova.');
        return;
      }

      setStatus('success');
      setMessage('Nuova email di conferma inviata! Controlla la tua casella email.');
    } catch (error) {
      console.error('Errore:', error);
      setStatus('error');
      setMessage('Errore imprevisto. Riprova.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src={`/assets/IMG_0055.png?v=${import.meta.env?.VITE_APP_VERSION || Date.now()}`}
              alt="ElevenBase"
              className="h-16 w-auto"
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = '/assets/logo_elevenBase.png' }}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ElevenBase
          </h1>
          <p className="text-muted-foreground">Conferma Email</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle>
              {status === 'loading' && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Conferma in corso...</span>
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span>Conferma Completata</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center justify-center space-x-2">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span>Errore di Conferma</span>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Stiamo confermando la tua email...'}
              {status === 'success' && 'La tua email è stata confermata con successo!'}
              {status === 'error' && 'Si è verificato un errore durante la conferma'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              {message}
            </p>
            
            {status === 'success' && (
              <Button onClick={handleContinue} className="w-full">
                Vai al Login
              </Button>
            )}
            
            {status === 'error' && (
              <div className="space-y-3">
                <Button onClick={handleContinue} className="w-full">
                  Torna al Login
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleResendEmail} 
                  className="w-full"
                >
                  Invia Nuova Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Riprova
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirm; 