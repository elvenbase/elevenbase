import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Lock, Users, Hash, Mail, Palette, FileText, Upload, Image, Settings, ArrowLeft } from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GDPRConsent from "@/components/forms/GDPRConsent";

const AuthMultiTeam = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  // Form state - solo login
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Usa il nuovo AuthContext
      const result = await signIn(loginData.email, loginData.password);
      
      if (result.error) {
        throw result.error;
      }
      
      // Se utente pending, reindirizza alla pagina di attesa
      if (result.isPending) {
        navigate('/pending-approval');
        return;
      }
      
      // Login riuscito per utenti attivi - reindirizza al dashboard
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il login');
    }
    
    setIsLoading(false);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate GDPR consent
    if (!gdprConsent) {
      toast.error('È necessario accettare il trattamento dei dati personali per procedere.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Starting team creation...', createTeamData);
      
      // 1. Sign up the user with GDPR consent in metadata
      console.log('Attempting signup for:', createTeamData.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createTeamData.email,
        password: createTeamData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm?type=signup`,
          data: {
            gdpr_consent: gdprConsent,
            marketing_consent: marketingConsent,
            consent_date: new Date().toISOString()
          }
        }
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

      // Wait for profile to be created by trigger, then save GDPR consent
      console.log('Waiting for profile creation and saving GDPR consent...');
      
      // Small delay to ensure trigger has processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: consentError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          gdpr_consent: gdprConsent,
          marketing_consent: marketingConsent,
          consent_date: new Date().toISOString(),
          consent_ip: null // Will be set by server if needed
        }, {
          onConflict: 'id'
        });

      if (consentError) {
        console.error('Error saving consent:', consentError);
        // Don't fail the entire process for consent saving issues
      } else {
        console.log('✅ GDPR consent saved successfully');
      }
      
      // 2. Check if team name or abbreviation already exists
      console.log('Checking if team name and abbreviation are available...');
      
      const { data: existingByName } = await supabase
        .from('teams')
        .select('name')
        .eq('name', createTeamData.teamName)
        .single();
      
      if (existingByName) {
        throw new Error(`Una squadra con il nome "${createTeamData.teamName}" esiste già. Scegli un nome diverso.`);
      }
      
      const { data: existingByAbbr } = await supabase
        .from('teams')
        .select('abbreviation')
        .eq('abbreviation', createTeamData.abbreviation.toUpperCase())
        .single();
      
      if (existingByAbbr) {
        throw new Error(`La sigla "${createTeamData.abbreviation.toUpperCase()}" è già in uso. Scegli una sigla diversa.`);
      }
      
      // 3. Create the team using our database function (works with anon key!)
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
      

      
      // 4. User is already added as admin by the database function
      console.log('User already added to team as admin by database function');
      
      // Invite codes are created automatically by the database function
      
      toast.success('Team creato con successo! Controlla la tua email per confermare l\'account e accedere.');
      
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la creazione della squadra');
    }
    
    setIsLoading(false);
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate GDPR consent
    if (!gdprConsent) {
      toast.error('È necessario accettare il trattamento dei dati personali per procedere.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Verify invite code exists and is valid in team_invites table
      console.log('🔍 Verifying invite code:', joinTeamData.inviteCode);
      
      // BYPASS SUPABASE CLIENT - usa fetch diretta per debugging
      console.log('🔧 Trying direct fetch to bypass client issues...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // FIX FINALE: Database ha codici in UPPERCASE + aggiungi filtri
      console.log('🔧 FINAL FIX: Using case-insensitive ILIKE query...');
      const currentTime = new Date().toISOString();
      // FIX FINALE: Use case-insensitive query (ilike)
      const response = await fetch(`${supabaseUrl}/rest/v1/team_invites?code=ilike.${encodeURIComponent(joinTeamData.inviteCode)}&is_active=eq.true&expires_at=gte.${encodeURIComponent(currentTime)}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('🔧 Direct fetch response status:', response.status);
      console.log('🔧 Direct fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 Direct fetch error:', errorText);
        throw new Error(`Direct fetch failed: ${response.status} ${errorText}`);
      }
      
      const inviteData = await response.json();
      console.log('🔧 Direct fetch data:', inviteData);
      
      const invite = inviteData && inviteData.length > 0 ? inviteData[0] : null;
      const inviteError = invite ? null : { message: 'No invite found' };
      
      console.log('🔍 Invite found (step 1):', invite);
      
      if (inviteError || !invite) {
        console.error('❌ Invite verification failed:');
        console.log('- Input code:', joinTeamData.inviteCode);
        console.log('- Error details:', inviteError);
        
        // Debug: Let's check what invite codes exist
        const { data: allInvites } = await supabase
          .from('team_invites')
          .select('code, role, expires_at, is_active')
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString())
          .limit(10);
        
        console.log('🔍 Available invite codes:');
        console.table(allInvites);
        throw new Error('Codice invito non valido o scaduto');
      }
      
      // DIRECT FETCH anche per teams (stesso problema del client)
      console.log('🔧 Direct fetch for teams data...');
      const teamResponse = await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${invite.team_id}&select=id,name`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('🔧 Teams direct fetch status:', teamResponse.status);
      
      if (!teamResponse.ok) {
        const teamErrorText = await teamResponse.text();
        console.error('🔧 Teams direct fetch error:', teamErrorText);
        throw new Error(`Teams fetch failed: ${teamResponse.status} ${teamErrorText}`);
      }
      
      const teamData = await teamResponse.json();
      console.log('🔧 Teams direct fetch data:', teamData);
      
      const team = teamData && teamData.length > 0 ? teamData[0] : null;
      const teamError = team ? null : { message: 'Team not found' };
      
      if (teamError || !team) {
        console.error('❌ Team not found:', teamError);
        throw new Error('Team associato al codice non trovato');
      }
      
      // Combina i dati
      const inviteWithTeam = {
        ...invite,
        teams: team
      };
      
      console.log('🔍 Invite with team data:', inviteWithTeam);
      
      if (inviteWithTeam.used_count >= inviteWithTeam.max_uses) {
        throw new Error('Questo codice invito ha raggiunto il limite di utilizzi');
      }
      
      console.log('✅ Valid invite found:', { 
        teamId: inviteWithTeam.teams.id, 
        teamName: inviteWithTeam.teams.name, 
        role: inviteWithTeam.role 
      });
      
      // 2. Sign up the user - Simplified
      console.log('Attempting signup for team join:', joinTeamData.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: joinTeamData.email,
        password: joinTeamData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm?type=signup`,
          data: {
            gdpr_consent: gdprConsent,
            marketing_consent: marketingConsent,
            consent_date: new Date().toISOString()
          }
        }
      });
      
      if (authError) {
        console.error('Join team auth error:', authError);
        throw authError;
      }
      
      // 3. Add user to team with role from invite
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: inviteWithTeam.team_id,
          user_id: authData.user?.id,
          role: inviteWithTeam.role,
          status: 'pending', // Will be activated after email confirmation
          joined_at: new Date().toISOString(),
          invited_by: inviteWithTeam.created_by
        });
      
      if (memberError) throw memberError;
      
      // 3.5. Create profile (now allowed by signup policy)
      console.log('🔧 Creating profile for new user...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          username: joinTeamData.email,
          status: 'active'
        });
      
      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Non bloccare la registrazione ma logga l'errore
      } else {
        console.log('✅ Profile created successfully');
      }

      // Save GDPR consent to user profile (after profile creation)
      console.log('Saving GDPR consent preferences...');
      
      // Small delay to ensure profile exists
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: consentError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id,
          gdpr_consent: gdprConsent,
          marketing_consent: marketingConsent,
          consent_date: new Date().toISOString(),
          consent_ip: null // Will be set by server if needed
        }, {
          onConflict: 'id'
        });

      if (consentError) {
        console.error('Error saving consent:', consentError);
        // Don't fail the entire process for consent saving issues
      } else {
        console.log('✅ GDPR consent saved successfully');
      }
      
      // 4. Update invite usage
      await supabase
        .from('team_invites')
        .update({
          used_count: inviteWithTeam.used_count + 1,
          last_used_at: new Date().toISOString(),
          last_used_by: authData.user?.id
        })
        .eq('id', inviteWithTeam.id);
      
      console.log('✅ Join team successful:', { 
        teamId: inviteWithTeam.team_id, 
        teamName: inviteWithTeam.teams.name, 
        userId: authData.user?.id,
        role: inviteWithTeam.role 
      });
      toast.success(`Registrazione completata! Controlla la tua email per confermare l'account e unirti a ${inviteWithTeam.teams.name}.`);
      
    } catch (error: any) {
      console.error('❌ Join team error:', error);
      toast.error(error.message || 'Errore durante la registrazione');
    }
    
    setIsLoading(false);
  };

  const handleGlobalAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = loginData.email.trim().toLowerCase();
      if (email !== 'coach@elevenbase.pro') throw new Error('Email non autorizzata');
      const { error } = await supabase.auth.signInWithPassword({ email, password: loginData.password });
      if (error) throw error;
      // Nessun flag locale: l'autorizzazione avviene via RLS/ruolo superadmin
      window.location.href = '/global-admin';
    } catch (err: any) {
      toast.error(err?.message || 'Errore login admin globale');
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
    <div className="min-h-screen bg-background px-4 pt-8 pb-6">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center">
          <SiteLogo 
            className="h-48 w-auto mx-auto"
            fallbackSrc="/assets/IMG_0055.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo_elevenBase.png' }}
          />
        </div>

        <Card className="shadow-lg mt-2 sm:mt-4">
          <CardHeader className="text-center pt-6 pb-4 sm:pt-8 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight mb-2 sm:mb-3">Accedi alla Piattaforma</CardTitle>
            <CardDescription className="mt-2 sm:mt-3 mb-5 sm:mb-6 px-6 leading-relaxed">Inserisci le tue credenziali per accedere a ElevenBase</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Simplified Login Form - No Tabs */}
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
            
            {/* Password Recovery Link */}
            {authMode !== 'global-admin' && (
              <div className="pt-4 border-t text-center space-y-2">
                <a
                  href="/reset-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Password dimenticata?
                </a>
                <div className="text-xs text-muted-foreground">
                  Registrandoti accetti la nostra{' '}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground mb-3">
            Nuovi alla piattaforma?
          </div>
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline font-medium"
          >
            🚀 Scopri tutto su ElevenBase
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthMultiTeam;