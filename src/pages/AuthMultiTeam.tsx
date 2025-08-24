import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Lock, Users, Hash, Mail, Palette, FileText, Upload, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthMultiTeam = () => {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'create-team' | 'join-team'>('login');
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [createTeamData, setCreateTeamData] = useState({
    email: 'test@elevenbase.com', // Pre-filled for testing
    password: 'Test123!',
    teamName: 'Test Team',
    fcName: 'Test FC',
    abbreviation: 'TST',
    primaryColor: '#DC2626',
    secondaryColor: '#1E40AF',
    logoFile: null as File | null,
    logoPreview: ''
  });
  const [joinTeamData, setJoinTeamData] = useState({
    email: '',
    password: '',
    inviteCode: ''
  });

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Il logo non può superare i 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCreateTeamData({
          ...createTeamData,
          logoFile: file,
          logoPreview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });
      
      if (error) throw error;
      
      // Check if user belongs to a team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('*, teams(*)')
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .single();
      
      if (!teamMember) {
        toast.error('Non appartieni a nessuna squadra. Contatta un amministratore.');
        await supabase.auth.signOut();
      } else {
        toast.success(`Benvenuto in ${teamMember.teams.name}!`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il login');
    }
    
    setIsLoading(false);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Starting team creation...', createTeamData);
      
      // 1. Sign up the user - Simplified without redirect
      console.log('Attempting signup for:', createTeamData.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createTeamData.email,
        password: createTeamData.password
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      console.log('User created:', authData.user?.id);
      
      // Wait a moment for the user to be properly created
      if (!authData.user?.id) {
        console.error('No user ID available after signup');
        throw new Error('Registrazione utente non completata. Riprova.');
      }
      
      // 2. Create the team using our database function (works with anon key!)
      console.log('Creating team via database function...');
      
      const { data: team, error: teamError } = await supabase
        .rpc('create_team_for_new_user', {
          p_name: createTeamData.teamName,
          p_fc_name: createTeamData.fcName || createTeamData.teamName,
          p_abbreviation: createTeamData.abbreviation.toUpperCase(),
          p_primary_color: createTeamData.primaryColor,
          p_secondary_color: createTeamData.secondaryColor,
          p_owner_id: authData.user.id,
          p_invite_code: createTeamData.abbreviation.toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase()
        });
      
      console.log('Team creation result:', team, 'Error:', teamError);
      
      if (teamError) {
        console.error('Team creation error:', teamError);
        throw teamError;
      }
      
      console.log('Team created:', team);
      
      // 3. Upload logo if provided (optional, don't fail if it doesn't work)
      let logoUrl = null;
      if (createTeamData.logoFile && team.id) {
        try {
          console.log('Uploading logo...');
          const fileExt = createTeamData.logoFile.name.split('.').pop();
          const fileName = `logo.${fileExt}`;
          const filePath = `${team.id}/${fileName}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('team-logos')
            .upload(filePath, createTeamData.logoFile, {
              upsert: true
            });
          
          if (uploadError) {
            console.error('Logo upload error:', uploadError);
            // Don't throw, just continue without logo
          } else if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('team-logos')
              .getPublicUrl(filePath);
            
            logoUrl = publicUrl;
            console.log('Logo uploaded:', logoUrl);
            
            // Update team with logo URL
            await supabase
              .from('teams')
              .update({ logo_url: logoUrl })
              .eq('id', team.id);
          }
        } catch (logoError) {
          console.error('Logo processing error:', logoError);
          // Continue without logo
        }
      }
      
      // 4. Add user as team admin
      console.log('Adding user as team admin...');
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: authData.user.id,
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString()
        });
      
      if (memberError) {
        console.error('Member creation error:', memberError);
        throw memberError;
      }
      
      console.log('User added to team as admin');
      
      // Invite codes are created automatically by the database function
      
      toast.success('Team creato con successo! Controlla la tua email per confermare l\'account e accedere.');
      
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la creazione della squadra');
    }
    
    setIsLoading(false);
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 1. Verify invite code exists and is valid
      const { data: invite, error: inviteError } = await supabase
        .from('team_invites')
        .select('*, teams(*)')
        .eq('code', joinTeamData.inviteCode.toUpperCase())
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();
      
      if (inviteError || !invite) {
        throw new Error('Codice invito non valido o scaduto');
      }
      
      if (invite.used_count >= invite.max_uses) {
        throw new Error('Questo codice invito ha raggiunto il limite di utilizzi');
      }
      
      // 2. Sign up the user - Simplified
      console.log('Attempting signup for team join:', joinTeamData.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: joinTeamData.email,
        password: joinTeamData.password
      });
      
      if (authError) {
        console.error('Join team auth error:', authError);
        throw authError;
      }
      
      // 3. Add user to team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invite.team_id,
          user_id: authData.user?.id,
          role: invite.role,
          status: 'pending', // Will be activated after email confirmation
          joined_at: new Date().toISOString(),
          invited_by: invite.created_by
        });
      
      if (memberError) throw memberError;
      
      // 4. Update invite usage
      await supabase
        .from('team_invites')
        .update({
          used_count: invite.used_count + 1,
          last_used_at: new Date().toISOString(),
          last_used_by: authData.user?.id
        })
        .eq('id', invite.id);
      
      toast.success(`Registrazione completata! Controlla la tua email per confermare l'account e unirti a ${invite.teams.name}.`);
      
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la registrazione');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/assets/IMG_0055.png"
            alt="Logo"
            className="h-24 w-auto mx-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo_elevenBase.png' }}
          />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle>Gestione Squadre</CardTitle>
            <CardDescription>
              Accedi, crea una nuova squadra o unisciti a una esistente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Accedi</TabsTrigger>
                <TabsTrigger value="create-team">Crea Squadra</TabsTrigger>
                <TabsTrigger value="join-team">Unisciti</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@esempio.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Accesso..." : "Accedi"}
                  </Button>
                </form>
              </TabsContent>

              {/* Create Team Tab */}
              <TabsContent value="create-team">
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="create-email">Email</Label>
                      <Input
                        id="create-email"
                        type="email"
                        placeholder="email@esempio.com"
                        value={createTeamData.email}
                        onChange={(e) => setCreateTeamData({ ...createTeamData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="create-password">Password</Label>
                      <Input
                        id="create-password"
                        type="password"
                        placeholder="Min. 6 caratteri"
                        value={createTeamData.password}
                        onChange={(e) => setCreateTeamData({ ...createTeamData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="team-name">Nome Squadra</Label>
                      <Input
                        id="team-name"
                        placeholder="Es: Ca De Rissi SG"
                        value={createTeamData.teamName}
                        onChange={(e) => setCreateTeamData({ ...createTeamData, teamName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fc-name">Nome su FC</Label>
                      <Input
                        id="fc-name"
                        placeholder="Nome nel gioco"
                        value={createTeamData.fcName}
                        onChange={(e) => setCreateTeamData({ ...createTeamData, fcName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="abbreviation">Sigla</Label>
                      <Input
                        id="abbreviation"
                        placeholder="Es: CDR"
                        maxLength={10}
                        value={createTeamData.abbreviation}
                        onChange={(e) => setCreateTeamData({ ...createTeamData, abbreviation: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="primary-color">Colore Primario</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          className="w-16 h-10 p-1"
                          value={createTeamData.primaryColor}
                          onChange={(e) => setCreateTeamData({ ...createTeamData, primaryColor: e.target.value })}
                        />
                        <Input
                          type="text"
                          value={createTeamData.primaryColor}
                          onChange={(e) => setCreateTeamData({ ...createTeamData, primaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary-color">Colore Secondario</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          className="w-16 h-10 p-1"
                          value={createTeamData.secondaryColor}
                          onChange={(e) => setCreateTeamData({ ...createTeamData, secondaryColor: e.target.value })}
                        />
                        <Input
                          type="text"
                          value={createTeamData.secondaryColor}
                          onChange={(e) => setCreateTeamData({ ...createTeamData, secondaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="team-logo">Logo Squadra (opzionale)</Label>
                      <div className="space-y-2">
                        {createTeamData.logoPreview && (
                          <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                            <img 
                              src={createTeamData.logoPreview} 
                              alt="Logo preview" 
                              className="h-24 w-24 object-contain"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            id="team-logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="flex-1"
                          />
                          {createTeamData.logoFile && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setCreateTeamData({ ...createTeamData, logoFile: null, logoPreview: '' })}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Max 5MB - JPG, PNG, GIF, WebP, SVG
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creazione..." : "Crea Squadra"}
                  </Button>
                </form>
              </TabsContent>

              {/* Join Team Tab */}
              <TabsContent value="join-team">
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div>
                    <Label htmlFor="join-email">Email</Label>
                    <Input
                      id="join-email"
                      type="email"
                      placeholder="email@esempio.com"
                      value={joinTeamData.email}
                      onChange={(e) => setJoinTeamData({ ...joinTeamData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="join-password">Password</Label>
                    <Input
                      id="join-password"
                      type="password"
                      placeholder="Min. 6 caratteri"
                      value={joinTeamData.password}
                      onChange={(e) => setJoinTeamData({ ...joinTeamData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-code">Codice Invito</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invite-code"
                        placeholder="Es: CDRPLAY720c0"
                        className="pl-10 uppercase"
                        value={joinTeamData.inviteCode}
                        onChange={(e) => setJoinTeamData({ ...joinTeamData, inviteCode: e.target.value })}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chiedi il codice all'amministratore della squadra
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registrazione..." : "Unisciti alla Squadra"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthMultiTeam;