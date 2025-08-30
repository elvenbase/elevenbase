import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Crown, 
  Shield, 
  Gamepad2, 
  Mail,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmailConfirmState {
  email?: string;
  flow?: 'founder' | 'invite';
  teamData?: {
    teamName: string;
    teamAbbreviation: string;
    primaryColor: string;
    secondaryColor: string;
  };
  inviteData?: {
    code: string;
    eaSportsId?: string;
    teamName: string;
    role: 'admin' | 'player';
  };
}

const EmailConfirm = () => {
  const [confirming, setConfirming] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<{
    success: boolean;
    message: string;
    flow?: 'founder' | 'invite';
    data?: any;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshRegistrationStatus } = useAuth();
  const { toast } = useToast();

  const state = location.state as EmailConfirmState | null;

  useEffect(() => {
    console.log('🔍 [EMAIL-CONFIRM] Component mounted, starting confirmation...');
    try {
      handleEmailConfirmation();
    } catch (error) {
      console.error('🚨 [EMAIL-CONFIRM] Error in useEffect:', error);
      setConfirming(false);
      setConfirmationResult({
        success: false,
        message: `Errore critico durante il caricamento: ${error}`
      });
    }
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      console.log('🔍 [EMAIL-CONFIRM] Starting handleEmailConfirmation...');
      
      // Controlla TUTTI i possibili parametri di conferma email Supabase
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      console.log('🔍 [EMAIL-CONFIRM] Parametri URL completi:', { 
        token, tokenHash, type, accessToken, refreshToken,
        fullURL: window.location.href 
      });
      
      // Prova diversi metodi di conferma
      let sessionEstablished = false;
      
      // Metodo 1: Se abbiamo access_token e refresh_token (nuovo flusso Supabase)
      if (accessToken && refreshToken) {
        console.log('Tentativo setSession con tokens...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (!sessionError && sessionData.session) {
          console.log('Sessione stabilita con tokens:', sessionData);
          sessionEstablished = true;
        } else {
          console.error('Errore setSession:', sessionError);
        }
      }
      
      // Metodo 2: Se abbiamo token_hash (vecchio flusso)
      if (!sessionEstablished && tokenHash && type) {
        console.log('Tentativo verifyOtp con token_hash...');
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        });
        
        if (!verifyError && verifyData.session) {
          console.log('Conferma riuscita con verifyOtp:', verifyData);
          sessionEstablished = true;
        } else {
          console.error('Errore verifica OTP:', verifyError);
        }
      }
      
      // Attendi un momento per assicurarsi che la sessione sia propagata
      if (sessionEstablished) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Poi ottieni la sessione finale
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Errore getSession:', error);
        setConfirmationResult({
          success: false,
          message: `Errore durante la conferma: ${error.message}`
        });
        return;
      }

      if (!data.session?.user) {
        console.log('Nessuna sessione trovata');
        setConfirmationResult({
          success: false,
          message: "Sessione non valida. Riprova il processo di registrazione."
        });
        return;
      }

      const user = data.session.user;
      const userMetadata = user.user_metadata || {};
      const flow = searchParams.get('flow') || userMetadata.flow || state?.flow;

      // Conferma email riuscita
      if (flow === 'founder') {
        setConfirmationResult({
          success: true,
          message: "Email confermata! Ora creeremo il tuo team.",
          flow: 'founder',
          data: {
            teamName: userMetadata.team_name || state?.teamData?.teamName,
            teamAbbreviation: userMetadata.team_abbreviation || state?.teamData?.teamAbbreviation,
            eaSportsTeamName: userMetadata.ea_sports_team_name || state?.teamData?.eaSportsTeamName,
            primaryColor: userMetadata.primary_color || state?.teamData?.primaryColor,
            secondaryColor: userMetadata.secondary_color || state?.teamData?.secondaryColor
          }
        });
      } else if (flow === 'invite') {
        // Recupera nome team dal codice invito se non disponibile in state
        let teamName = state?.inviteData?.teamName;
        let role = state?.inviteData?.role;
        
        const inviteCode = userMetadata.invite_code || state?.inviteData?.code;
        
        if (!teamName && inviteCode) {
          try {
            console.log('🔍 [EMAIL-CONFIRM] Recupero dati team da codice invito:', inviteCode);
            const { data: invite, error } = await supabase
              .from('team_invites')
              .select(`
                role,
                team_id,
                teams!inner(name)
              `)
              .eq('code', inviteCode.toUpperCase())
              .eq('is_active', true)
              .single();
            
            if (!error && invite) {
              teamName = invite.teams.name;
              role = invite.role;
              console.log('🔍 [EMAIL-CONFIRM] Team trovato:', { teamName, role });
            }
          } catch (error) {
            console.error('🚨 [EMAIL-CONFIRM] Errore recupero team da invite:', error);
          }
        }
        
        setConfirmationResult({
          success: true,
          message: "Email confermata! Ora ti registreremo al team.",
          flow: 'invite',
          data: {
            inviteCode,
            eaSportsId: userMetadata.ea_sports_id || state?.inviteData?.eaSportsId,
            teamName,
            role
          }
        });
      } else {
        setConfirmationResult({
          success: true,
          message: "Email confermata con successo!"
        });
      }
    } catch (error) {
      console.error('🚨 [EMAIL-CONFIRM] Errore durante la conferma:', error);
      console.error('🚨 [EMAIL-CONFIRM] Error stack:', error);
      setConfirmationResult({
        success: false,
        message: `Errore imprevisto durante la conferma: ${error}`
      });
    } finally {
      console.log('🔍 [EMAIL-CONFIRM] Setting confirming to false...');
      setConfirming(false);
    }
  };

  const completeFounderRegistration = async () => {
    if (!confirmationResult?.data) return;

    setProcessing(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      
      if (!user) {
        throw new Error("Sessione utente non trovata");
      }

      const { data: result, error } = await supabase.rpc('register_founder_with_team', {
        _user_id: user.id,
        _team_name: confirmationResult.data.teamName,
        _team_abbreviation: confirmationResult.data.teamAbbreviation,
        _primary_color: confirmationResult.data.primaryColor,
        _secondary_color: confirmationResult.data.secondaryColor,
        _ea_sports_team_name: confirmationResult.data.eaSportsTeamName
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "🎉 Team creato con successo!",
        description: `Il team "${confirmationResult.data.teamName}" è stato creato. Benvenuto come Founder!`
      });

      // Refresh registration status
      await refreshRegistrationStatus();
      
      // Reindirizza alla dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Errore creazione team:', error);
      toast({
        title: "Errore creazione team",
        description: error.message || "Si è verificato un errore durante la creazione del team",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const completeInviteRegistration = async () => {
    if (!confirmationResult?.data) return;

    setProcessing(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      
      if (!user) {
        throw new Error("Sessione utente non trovata");
      }

      const { data: result, error } = await supabase.rpc('register_with_invite_code', {
        _user_id: user.id,
        _invite_code: confirmationResult.data.inviteCode,
        _ea_sports_id: confirmationResult.data.eaSportsId || null
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "🎯 Registrazione completata!",
        description: `Ti sei registrato come ${confirmationResult.data.role} nel team "${confirmationResult.data.teamName}". Il tuo account è in attesa di approvazione.`
      });

      // Refresh registration status
      await refreshRegistrationStatus();
      
      // Reindirizza al login
      navigate('/auth', { 
        state: { 
          message: "Registrazione completata! Effettua il login. Il tuo account è in attesa di approvazione.",
          email: user.email
        } 
      });
    } catch (error: any) {
      console.error('Errore registrazione team:', error);
      toast({
        title: "Errore registrazione",
        description: error.message || "Si è verificato un errore durante la registrazione al team",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = () => {
    if (confirmationResult?.flow === 'founder') {
      completeFounderRegistration();
    } else if (confirmationResult?.flow === 'invite') {
      completeInviteRegistration();
    } else {
      navigate('/auth');
    }
  };

  const getFlowIcon = (flow?: string) => {
    if (flow === 'founder') return <Crown className="w-8 h-8 text-yellow-500" />;
    if (flow === 'invite') return <Shield className="w-8 h-8 text-blue-500" />;
    return <Mail className="w-8 h-8 text-green-500" />;
  };

  const getFlowTitle = (flow?: string) => {
    if (flow === 'founder') return "Conferma Founder";
    if (flow === 'invite') return "Conferma Invito";
    return "Conferma Email";
  };

  const getFlowDescription = (flow?: string) => {
    if (flow === 'founder') return "La tua email è stata confermata. Procediamo con la creazione del team.";
    if (flow === 'invite') return "La tua email è stata confermata. Procediamo con la registrazione al team.";
    return "La tua email è stata confermata con successo.";
  };

  console.log('🔍 [EMAIL-CONFIRM] Rendering - confirming:', confirming, 'confirmationResult:', confirmationResult);

  if (confirming) {
    console.log('🔍 [EMAIL-CONFIRM] Showing loading screen...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Confermando email...</h3>
              <p className="text-muted-foreground">
                Stiamo verificando la tua email, attendere prego.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('🔍 [EMAIL-CONFIRM] Showing confirmation result screen...');

  // Fallback di sicurezza se confirmationResult è null
  if (!confirmationResult) {
    console.log('🚨 [EMAIL-CONFIRM] confirmationResult is null, showing fallback...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-red-600">Errore di Caricamento</h3>
              <p className="text-muted-foreground">
                La pagina di conferma non è riuscita a caricare correttamente.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              {confirmationResult?.success ? (
                getFlowIcon(confirmationResult.flow)
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {confirmationResult?.success ? getFlowTitle(confirmationResult.flow) : "Errore Conferma"}
            </CardTitle>
            <CardDescription className="text-lg">
              {confirmationResult?.success ? getFlowDescription(confirmationResult.flow) : "Si è verificato un problema"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {confirmationResult?.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {confirmationResult.message}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {confirmationResult?.message || "Errore sconosciuto"}
                </AlertDescription>
              </Alert>
            )}

            {/* Dettagli specifici per flow */}
            {confirmationResult?.success && confirmationResult.flow === 'founder' && confirmationResult.data && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Dettagli Team
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nome:</strong> {confirmationResult.data.teamName}</div>
                  <div><strong>Sigla:</strong> {confirmationResult.data.teamAbbreviation}</div>
                  <div className="flex items-center gap-2">
                    <strong>Colori:</strong>
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: confirmationResult.data.primaryColor }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: confirmationResult.data.secondaryColor }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {confirmationResult?.success && confirmationResult.flow === 'invite' && confirmationResult.data && (
              <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Dettagli Registrazione
                </h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Team:</strong> {confirmationResult.data.teamName}</div>
                  <div className="flex items-center gap-2">
                    <strong>Ruolo:</strong>
                    <Badge variant={confirmationResult.data.role === 'admin' ? 'default' : 'secondary'}>
                      {confirmationResult.data.role === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="w-3 h-3 mr-1" />
                          Player
                        </>
                      )}
                    </Badge>
                  </div>
                  {confirmationResult.data.eaSportsId && (
                    <div><strong>EA Sports ID:</strong> {confirmationResult.data.eaSportsId}</div>
                  )}
                </div>
              </div>
            )}

            {/* Azioni */}
            <div className="space-y-4">
              {confirmationResult?.success ? (
                <Button 
                  onClick={handleComplete} 
                  disabled={processing}
                  className="w-full text-lg py-6"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completando...
                    </>
                  ) : (
                    <>
                      {confirmationResult.flow === 'founder' ? "🚀 Crea Team" : 
                       confirmationResult.flow === 'invite' ? "🎯 Unisciti al Team" : "Continua"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="w-full"
                  >
                    Torna al Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/register-founder')}
                    variant="outline"
                    className="w-full"
                  >
                    Riprova Registrazione
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirm;