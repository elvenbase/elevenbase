import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EmailConfirm = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      // Logout globale e messaggio informativo: il gating avverrà al login
      try { await supabase.auth.signOut({ scope: 'global' as const }); } catch { /* no-op */ }
      setStatus('success');
      setMessage('Email confermata con successo! Ora puoi accedere dal login.');
    };
    run();
  }, []);

  const handleContinue = () => {
    navigate('/auth');
  };

  const handleResendEmail = async () => navigate('/auth');

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
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>Se sei un <strong>giocatore</strong>, il tuo accesso verrà abilitato dall’amministratore del team.</p>
                <p>Se sei un <strong>admin/owner</strong>, effettua l’accesso ora.</p>
              </div>
            )}
            
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