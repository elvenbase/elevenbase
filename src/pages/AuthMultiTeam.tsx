import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, LogIn, UserPlus, Shield, Zap, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  teamName: string;
  fcName: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: File;
}

interface TeamJoinData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  inviteCode: string;
}

interface LoginData {
  email: string;
  password: string;
}

const AuthMultiTeam: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'login' | 'create' | 'join'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });

  const [teamCreationData, setTeamCreationData] = useState<TeamCreationData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    teamName: '',
    fcName: '',
    abbreviation: '',
    primaryColor: '#DC2626',
    secondaryColor: '#1E40AF'
  });

  const [teamJoinData, setTeamJoinData] = useState<TeamJoinData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    inviteCode: ''
  });

  const resetError = () => {
    setError(null);
    setSuccess(null);
  };

  // Handle existing user login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;
      if (data.user) {
        toast({
          title: "Login effettuato con successo",
          description: "Benvenuto in ElevenBase!"
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle team creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setIsLoading(true);

    try {
      // Validate form
      if (!teamCreationData.email || !teamCreationData.password || 
          !teamCreationData.firstName || !teamCreationData.lastName ||
          !teamCreationData.teamName || !teamCreationData.fcName || 
          !teamCreationData.abbreviation) {
        throw new Error('Tutti i campi sono obbligatori');
      }

      if (teamCreationData.abbreviation.length > 3) {
        throw new Error('L\'abbreviazione deve essere massimo 3 caratteri');
      }

      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teamCreationData.email,
        password: teamCreationData.password,
        options: {
          data: {
            first_name: teamCreationData.firstName,
            last_name: teamCreationData.lastName,
            username: `${teamCreationData.firstName.toLowerCase()}.${teamCreationData.lastName.toLowerCase()}`
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Errore nella creazione dell\'utente');

      // Step 2: Create team using the special function (callable with ANON KEY)
      const { data: teamResult, error: teamError } = await supabase.rpc('create_team_for_new_user', {
        user_email: teamCreationData.email,
        team_name: teamCreationData.teamName,
        fc_name: teamCreationData.fcName,
        abbreviation: teamCreationData.abbreviation.toUpperCase(),
        primary_color: teamCreationData.primaryColor,
        secondary_color: teamCreationData.secondaryColor
      });

      if (teamError) throw teamError;
      if (!teamResult?.success) {
        throw new Error(teamResult?.error || 'Errore nella creazione del team');
      }

      // Success!
      setSuccess(`
        🎉 Team "${teamCreationData.teamName}" creato con successo!
        
        📧 Ti abbiamo inviato un'email di conferma a ${teamCreationData.email}
        
        🔑 Codici invito generati:
        • Admin: ${teamResult.invite_codes.admin}
        • Coach: ${teamResult.invite_codes.coach}  
        • Player: ${teamResult.invite_codes.player}
        
        ⚠️ Conferma la tua email per accedere al tuo team!
      `);

      toast({
        title: "Team creato con successo!",
        description: `Controlla la tua email per confermare l'account`,
        duration: 5000
      });

    } catch (error: any) {
      console.error('Team creation error:', error);
      setError(error.message || 'Errore nella creazione del team');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle team join
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setIsLoading(true);

    try {
      // Validate form
      if (!teamJoinData.email || !teamJoinData.password || 
          !teamJoinData.firstName || !teamJoinData.lastName ||
          !teamJoinData.inviteCode) {
        throw new Error('Tutti i campi sono obbligatori');
      }

      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teamJoinData.email,
        password: teamJoinData.password,
        options: {
          data: {
            first_name: teamJoinData.firstName,
            last_name: teamJoinData.lastName,
            username: `${teamJoinData.firstName.toLowerCase()}.${teamJoinData.lastName.toLowerCase()}`
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Errore nella creazione dell\'utente');

      // Step 2: Join team using invite code
      const { data: joinResult, error: joinError } = await supabase.rpc('join_team_with_code', {
        user_email: teamJoinData.email,
        invite_code: teamJoinData.inviteCode.toUpperCase()
      });

      if (joinError) throw joinError;
      if (!joinResult?.success) {
        throw new Error(joinResult?.error || 'Errore nell\'accesso al team');
      }

      // Success!
      setSuccess(`
        🎉 Ti sei unito al team "${joinResult.team_name}" con successo!
        
        📧 Ti abbiamo inviato un'email di conferma a ${teamJoinData.email}
        
        🏆 Team: ${joinResult.fc_name} (${joinResult.abbreviation})
        👤 Ruolo: ${joinResult.role}
        
        ⚠️ Conferma la tua email per accedere al team!
      `);

      toast({
        title: "Iscritto al team con successo!",
        description: `Benvenuto in ${joinResult.team_name}`,
        duration: 5000
      });

    } catch (error: any) {
      console.error('Team join error:', error);
      setError(error.message || 'Errore nell\'accesso al team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚽ ElevenBase
          </h1>
          <p className="text-lg text-gray-600">
            La piattaforma per gestire la tua squadra di calcio
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accesso Multi-Team</CardTitle>
            <CardDescription>
              Accedi, crea il tuo team o unisciti a uno esistente
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Crea Team
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Unisciti
                </TabsTrigger>
              </TabsList>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription className="whitespace-pre-line">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="whitespace-pre-line text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      placeholder="la.tua.email@esempio.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Accesso in corso...' : 'Accedi'}
                  </Button>
                </form>
              </TabsContent>

              {/* Create Team Tab */}
              <TabsContent value="create">
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-firstName">Nome</Label>
                      <Input
                        id="create-firstName"
                        value={teamCreationData.firstName}
                        onChange={(e) => setTeamCreationData({...teamCreationData, firstName: e.target.value})}
                        placeholder="Mario"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-lastName">Cognome</Label>
                      <Input
                        id="create-lastName"
                        value={teamCreationData.lastName}
                        onChange={(e) => setTeamCreationData({...teamCreationData, lastName: e.target.value})}
                        placeholder="Rossi"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={teamCreationData.email}
                      onChange={(e) => setTeamCreationData({...teamCreationData, email: e.target.value})}
                      placeholder="mario.rossi@esempio.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="create-password">Password</Label>
                    <Input
                      id="create-password"
                      type="password"
                      value={teamCreationData.password}
                      onChange={(e) => setTeamCreationData({...teamCreationData, password: e.target.value})}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Dettagli Team
                    </h3>
                    
                    <div>
                      <Label htmlFor="teamName">Nome Team</Label>
                      <Input
                        id="teamName"
                        value={teamCreationData.teamName}
                        onChange={(e) => setTeamCreationData({...teamCreationData, teamName: e.target.value})}
                        placeholder="AC Milan"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="fcName">Nome Football Club</Label>
                      <Input
                        id="fcName"
                        value={teamCreationData.fcName}
                        onChange={(e) => setTeamCreationData({...teamCreationData, fcName: e.target.value})}
                        placeholder="Associazione Calcio Milan"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="abbreviation">Abbreviazione (max 3 caratteri)</Label>
                      <Input
                        id="abbreviation"
                        value={teamCreationData.abbreviation}
                        onChange={(e) => setTeamCreationData({...teamCreationData, abbreviation: e.target.value.toUpperCase()})}
                        placeholder="MIL"
                        maxLength={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Colore Primario</Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={teamCreationData.primaryColor}
                          onChange={(e) => setTeamCreationData({...teamCreationData, primaryColor: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Colore Secondario</Label>
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={teamCreationData.secondaryColor}
                          onChange={(e) => setTeamCreationData({...teamCreationData, secondaryColor: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creazione in corso...' : 'Crea Team e Account'}
                  </Button>
                </form>
              </TabsContent>

              {/* Join Team Tab */}
              <TabsContent value="join">
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="join-firstName">Nome</Label>
                      <Input
                        id="join-firstName"
                        value={teamJoinData.firstName}
                        onChange={(e) => setTeamJoinData({...teamJoinData, firstName: e.target.value})}
                        placeholder="Mario"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="join-lastName">Cognome</Label>
                      <Input
                        id="join-lastName"
                        value={teamJoinData.lastName}
                        onChange={(e) => setTeamJoinData({...teamJoinData, lastName: e.target.value})}
                        placeholder="Rossi"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="join-email">Email</Label>
                    <Input
                      id="join-email"
                      type="email"
                      value={teamJoinData.email}
                      onChange={(e) => setTeamJoinData({...teamJoinData, email: e.target.value})}
                      placeholder="mario.rossi@esempio.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="join-password">Password</Label>
                    <Input
                      id="join-password"
                      type="password"
                      value={teamJoinData.password}
                      onChange={(e) => setTeamJoinData({...teamJoinData, password: e.target.value})}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="inviteCode">Codice Invito Team</Label>
                    <Input
                      id="inviteCode"
                      value={teamJoinData.inviteCode}
                      onChange={(e) => setTeamJoinData({...teamJoinData, inviteCode: e.target.value.toUpperCase()})}
                      placeholder="ABC12345"
                      maxLength={8}
                      className="font-mono"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Ricevi il codice dal tuo allenatore o amministratore del team
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Iscrizione in corso...' : 'Unisciti al Team'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Problemi? Contatta il supporto tecnico</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthMultiTeam;