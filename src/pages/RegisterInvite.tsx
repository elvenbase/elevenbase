import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Shield, Gamepad2, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InviteInfo {
  team_name: string;
  role: 'admin' | 'player';
  expires_at: string;
  max_uses: number;
  used_count: number;
}

const RegisterInvite = () => {
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [codeError, setCodeError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
    eaSportsId: ''
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-popola codice se presente nell'URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setFormData(prev => ({ ...prev, inviteCode: codeFromUrl }));
      validateInviteCode(codeFromUrl);
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setInviteInfo(null);
      setCodeError('');
      return;
    }

    setValidatingCode(true);
    setCodeError('');

    try {
      const { data: invite, error } = await supabase
        .from('team_invites')
        .select(`
          role,
          expires_at,
          max_uses,
          used_count,
          team_id
        `)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !invite) {
        setCodeError('Codice invito non valido');
        setInviteInfo(null);
        return;
      }

      // Ottieni nome team separatamente
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('id', invite.team_id)
        .single();

      if (teamError || !team) {
        setCodeError('Errore nel caricamento dati team');
        setInviteInfo(null);
        return;
      }

      // Verifica scadenza
      if (new Date(invite.expires_at) < new Date()) {
        setCodeError('Codice invito scaduto');
        setInviteInfo(null);
        return;
      }

      // Verifica utilizzi disponibili
      if (invite.used_count >= invite.max_uses) {
        setCodeError('Codice invito esaurito');
        setInviteInfo(null);
        return;
      }

      setInviteInfo({
        team_name: team.name,
        role: invite.role,
        expires_at: invite.expires_at,
        max_uses: invite.max_uses,
        used_count: invite.used_count
      });
    } catch (error) {
      console.error('Errore validazione codice:', error);
      setCodeError('Errore durante la validazione del codice');
      setInviteInfo(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCodeChange = (code: string) => {
    const upperCode = code.toUpperCase();
    setFormData(prev => ({ ...prev, inviteCode: upperCode }));
    
    // Debounce validation
    clearTimeout((window as any).codeValidationTimeout);
    (window as any).codeValidationTimeout = setTimeout(() => {
      validateInviteCode(upperCode);
    }, 500);
  };

  const validateEaSportsId = async (eaSportsId: string) => {
    if (!eaSportsId.trim() || !inviteInfo?.team_name) return { valid: true };

    try {
      // Ottieni team_id dal nome (per la validazione)
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('name', inviteInfo.team_name)
        .single();

      if (!team) return { valid: false, error: 'Team non trovato' };

      const { data: validation, error } = await supabase.rpc('validate_ea_sports_id', {
        _ea_sports_id: eaSportsId,
        _team_id: team.id
      });

      if (error) {
        return { valid: false, error: 'Errore durante la validazione' };
      }

      return validation;
    } catch (error) {
      return { valid: false, error: 'Errore di connessione' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteInfo) {
      toast({
        title: "Errore",
        description: "Codice invito non valido",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive"
      });
      return;
    }

    // Validazione EA Sports ID per player
    if (inviteInfo.role === 'player') {
      if (!formData.eaSportsId.trim()) {
        toast({
          title: "Errore",
          description: "EA Sports ID è obbligatorio per i giocatori",
          variant: "destructive"
        });
        return;
      }

      const eaValidation = await validateEaSportsId(formData.eaSportsId);
      if (!eaValidation.valid) {
        toast({
          title: "EA Sports ID non valido",
          description: eaValidation.error || "ID già utilizzato o non valido",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Registrazione utente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm?type=signup&flow=invite`,
          data: { 
            invite_code: formData.inviteCode,
            ea_sports_id: formData.eaSportsId || null
          }
        }
      });

      if (authError) {
        toast({
          title: "Errore registrazione",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      if (authData.user) {
        // Se email già confermata, procedi con registrazione team
        if (authData.user.email_confirmed_at) {
          const { data: registrationResult, error: regError } = await supabase.rpc('register_with_invite_code', {
            _user_id: authData.user.id,
            _invite_code: formData.inviteCode,
            _ea_sports_id: formData.eaSportsId || null
          });

          if (regError) {
            toast({
              title: "Errore registrazione team",
              description: regError.message,
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "🎉 Registrazione completata!",
            description: `Ti sei registrato come ${inviteInfo.role} nel team "${inviteInfo.team_name}". Il tuo account è in attesa di approvazione.`
          });
          
          navigate('/auth', { state: { email: formData.email } });
        } else {
          // Email non confermata
          toast({
            title: "✅ Registrazione inviata",
            description: "Controlla la tua email e clicca sul link di conferma per completare la registrazione al team."
          });
          
          navigate('/email-sent', { 
            state: { 
              email: formData.email, 
              flow: 'invite',
              inviteData: {
                code: formData.inviteCode,
                eaSportsId: formData.eaSportsId,
                teamName: inviteInfo.team_name,
                role: inviteInfo.role
              }
            } 
          });
        }
      }
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      toast({
        title: "Errore imprevisto",
        description: "Si è verificato un errore durante la registrazione. Riprova.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Unisciti al Team</CardTitle>
            <CardDescription className="text-lg">
              Registrati con il codice invito ricevuto
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Codice Invito */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Codice Invito *</Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    value={formData.inviteCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="ABC12345"
                    required
                    className={`text-center text-lg font-mono uppercase tracking-wider ${
                      codeError ? 'border-red-500' : inviteInfo ? 'border-green-500' : ''
                    }`}
                    maxLength={8}
                  />
                  {validatingCode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                
                {codeError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{codeError}</AlertDescription>
                  </Alert>
                )}
                
                {inviteInfo && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Team: {inviteInfo.team_name}</span>
                        <Badge variant={inviteInfo.role === 'admin' ? 'default' : 'secondary'}>
                          {inviteInfo.role === 'admin' ? (
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
                      <div className="text-xs text-muted-foreground">
                        Utilizzi: {inviteInfo.used_count}/{inviteInfo.max_uses} • 
                        Scade: {new Date(inviteInfo.expires_at).toLocaleDateString('it-IT')}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Dati Personali */}
              {inviteInfo && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="tua@email.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                        placeholder="il_tuo_username"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            placeholder="••••••••"
                            minLength={6}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Conferma *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                    </div>

                    {/* EA Sports ID per Player (obbligatorio) e Admin (opzionale) */}
                    {(inviteInfo.role === 'player' || inviteInfo.role === 'admin') && (
                      <div className="space-y-2">
                        <Label htmlFor="eaSportsId" className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4" />
                          EA Sports ID {inviteInfo.role === 'player' ? '*' : '(opzionale)'}
                        </Label>
                        <Input
                          id="eaSportsId"
                          value={formData.eaSportsId}
                          onChange={(e) => setFormData(prev => ({ ...prev, eaSportsId: e.target.value }))}
                          required={inviteInfo.role === 'player'}
                          placeholder={inviteInfo.role === 'player' ? 'Il tuo EA Sports ID' : 'Il tuo EA Sports ID (opzionale)'}
                          className="text-center font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          {inviteInfo.role === 'player' 
                            ? 'Questo ID verrà associato al tuo profilo giocatore e non potrà essere modificato.'
                            : 'Puoi aggiungere il tuo EA Sports ID ora o successivamente nelle impostazioni.'
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full text-lg py-6">
                    {loading ? "Registrazione in corso..." : `🎯 Registrati come ${inviteInfo.role === 'admin' ? 'Admin' : 'Player'}`}
                  </Button>
                </>
              )}
            </form>

            <div className="text-center space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Hai già un account?{' '}
                <Link to="/auth" className="text-blue-600 hover:underline font-medium">
                  Accedi qui
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Vuoi creare un nuovo team?{' '}
                <Link to="/register-founder" className="text-purple-600 hover:underline font-medium">
                  Registrati come Founder
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterInvite;