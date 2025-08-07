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

        // Se abbiamo un access_token (da query params o hash), significa che l'utente è già autenticato
        if (accessToken || hashAccessToken) {
          console.log('Access token ricevuto, utente già autenticato');
          setStatus('success');
          setMessage('Email confermata con successo! Ora puoi accedere.');
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
            setStatus('error');
            setMessage('Link di conferma scaduto o non valido. Richiedi una nuova email di conferma.');
            return;
          }

          setStatus('success');
          setMessage('Email confermata con successo! Ora puoi accedere.');
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
        console.log('Access token ricevuto dall\'hash, utente già autenticato');
        setStatus('success');
        setMessage('Email confermata con successo! Ora puoi accedere.');
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
              src="/assets/logo_elevenBase.png" 
              alt="ElevenBase" 
              className="h-16 w-16 rounded-lg"
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