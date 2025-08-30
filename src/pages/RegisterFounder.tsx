import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Crown, Users, Shield, Gamepad2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSiteAssets } from '@/hooks/useSiteAssets';

const RegisterFounder = () => {
  const [loading, setLoading] = useState(false);
  const [abbreviationStatus, setAbbreviationStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { logoUrl: globalLogo } = useSiteAssets();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    teamName: '',
    teamAbbreviation: '',
    eaSportsTeamName: '',
    eaSportsId: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    acceptPrivacy: false,
    acceptNewsletter: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Funzione per verificare la sigla in tempo reale
  const checkAbbreviationAvailability = async (abbreviation: string) => {
    if (!abbreviation || abbreviation.length < 2) {
      setAbbreviationStatus('idle');
      return;
    }

    setAbbreviationStatus('checking');
    
    try {
      const { data: existingTeam, error } = await supabase
        .from('teams')
        .select('id, abbreviation')
        .eq('abbreviation', abbreviation.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking abbreviation:', error);
        setAbbreviationStatus('idle');
        return;
      }

      setAbbreviationStatus(existingTeam ? 'taken' : 'available');
    } catch (error) {
      console.error('Error in abbreviation check:', error);
      setAbbreviationStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    


    if (formData.password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive"
      });
      return;
    }

    if (!formData.acceptPrivacy) {
      toast({
        title: "Errore",
        description: "Devi accettare la Privacy Policy per continuare",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 0. Verifica che la sigla del team non sia già in uso
      console.log('🎯 [TEAM DEBUG] Checking team abbreviation:', formData.teamAbbreviation);
      const { data: existingTeam, error: checkError } = await supabase
        .from('teams')
        .select('id, abbreviation')
        .eq('abbreviation', formData.teamAbbreviation.toUpperCase())
        .maybeSingle();

      if (checkError) {
        console.error('Error checking team abbreviation:', checkError);
        toast({
          title: "Errore verifica",
          description: "Errore durante la verifica della sigla. Riprova.",
          variant: "destructive"
        });
        return;
      }

      if (existingTeam) {
        toast({
          title: "Sigla già in uso",
          description: `La sigla "${formData.teamAbbreviation.toUpperCase()}" è già utilizzata da un altro team. Scegli una sigla diversa.`,
          variant: "destructive"
        });
        return;
      }

      console.log('🎯 [TEAM DEBUG] Team abbreviation available, proceeding with registration');

      // 1. Registrazione utente su Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm?type=signup&flow=founder`,
          data: { 
            team_name: formData.teamName,
            team_abbreviation: formData.teamAbbreviation,
            ea_sports_team_name: formData.eaSportsTeamName,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor
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
        // Se l'utente è già confermato, procedi con la creazione del team
        if (authData.user.email_confirmed_at) {
          const { data: teamResult, error: teamError } = await supabase.rpc('register_founder_with_team', {
            _user_id: authData.user.id,
            _team_name: formData.teamName,
            _team_abbreviation: formData.teamAbbreviation,
            _primary_color: formData.primaryColor,
            _secondary_color: formData.secondaryColor,
            _ea_sports_id: formData.eaSportsId || null,
            _ea_sports_team_name: formData.eaSportsTeamName || null
          });

          if (teamError) {
            toast({
              title: "Errore creazione team",
              description: teamError.message,
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "🎉 Registrazione completata!",
            description: `Team "${formData.teamName}" creato con successo. Puoi ora effettuare il login.`
          });
          
          navigate('/auth', { state: { email: formData.email } });
        } else {
          // Email non ancora confermata
          toast({
            title: "✅ Registrazione inviata",
            description: "Controlla la tua email e clicca sul link di conferma per completare la registrazione e creare il team."
          });
          
          navigate('/email-sent', { 
            state: { 
              email: formData.email, 
              flow: 'founder',
              teamData: {
                teamName: formData.teamName,
                teamAbbreviation: formData.teamAbbreviation,
                primaryColor: formData.primaryColor,
                secondaryColor: formData.secondaryColor
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Se è il campo abbreviation, verifica disponibilità
    if (field === 'teamAbbreviation' && typeof value === 'string') {
      // Debounce: aspetta 500ms prima di controllare
      setTimeout(() => {
        checkAbbreviationAvailability(value);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header con logo */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-300/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[64px] py-2">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla Home
                </Button>
              </Link>
              {globalLogo && (
                <img 
                  src={globalLogo}
                  alt="ElevenBase Logo"
                  className="h-8 md:h-12 w-auto object-cover"
                  style={{ maxWidth: '180px' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="flex items-center justify-center p-4 pt-12">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-800">Crea il tuo Team</CardTitle>
              <CardDescription className="text-lg text-slate-600">
                Registrati come <span className="font-semibold text-blue-600">Founder</span> e inizia a gestire la tua squadra su <span className="font-semibold text-blue-600">ElevenBase</span>
              </CardDescription>
            </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sezione Dati Personali */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="w-5 h-5" />
                  Dati Personali
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="founder@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              <Separator />

              {/* Sezione Dati Team */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="w-5 h-5" />
                  Dati del Team
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Nome Team *</Label>
                    <Input
                      id="teamName"
                      value={formData.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      required
                      placeholder="FC Esempio"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamAbbreviation">Abbreviazione *</Label>
                    <div className="relative">
                      <Input
                        id="teamAbbreviation"
                        value={formData.teamAbbreviation}
                        onChange={(e) => handleInputChange('teamAbbreviation', e.target.value.toUpperCase())}
                        required
                        placeholder="FCE"
                        maxLength={10}
                        className={
                          abbreviationStatus === 'taken' ? 'border-red-500 focus:border-red-500' :
                          abbreviationStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                          ''
                        }
                      />
                      {abbreviationStatus === 'checking' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                        </div>
                      )}
                    </div>
                    {abbreviationStatus === 'available' && (
                      <p className="text-sm text-green-600">✅ Sigla disponibile</p>
                    )}
                    {abbreviationStatus === 'taken' && (
                      <p className="text-sm text-red-600">❌ Sigla già in uso, scegline un'altra</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eaSportsTeamName">Nome EA Sports FC</Label>
                  <Input
                    id="eaSportsTeamName"
                    value={formData.eaSportsTeamName}
                    onChange={(e) => handleInputChange('eaSportsTeamName', e.target.value)}
                    placeholder="Nome del team come appare in EA Sports FC"
                    maxLength={100}
                  />
                  <p className="text-sm text-gray-500">
                    Il nome della squadra come appare nel gioco EA Sports FC (opzionale ma utile per le statistiche)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eaSportsId" className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    EA Sports ID Founder
                  </Label>
                  <Input
                    id="eaSportsId"
                    value={formData.eaSportsId}
                    onChange={(e) => handleInputChange('eaSportsId', e.target.value)}
                    placeholder="Il tuo EA Sports ID personale (opzionale)"
                    className="text-center font-mono"
                  />
                  <p className="text-sm text-gray-500">
                    Il tuo EA Sports ID personale. Può essere aggiunto ora o successivamente nelle impostazioni.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Colore Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-20 h-10 p-1 rounded"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Colore Secondario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-20 h-10 p-1 rounded"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        placeholder="#1E40AF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Privacy e Newsletter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onChange={(e) => handleInputChange('acceptPrivacy', e.target.checked)}
                    className="rounded border-gray-300"
                    required
                  />
                  <Label htmlFor="acceptPrivacy" className="text-sm">
                    Accetto la <Link to="/privacy-policy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</Link> *
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptNewsletter"
                    checked={formData.acceptNewsletter}
                    onChange={(e) => handleInputChange('acceptNewsletter', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="acceptNewsletter" className="text-sm">
                    Accetto di ricevere newsletter e aggiornamenti
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading || !formData.acceptPrivacy || abbreviationStatus === 'taken' || abbreviationStatus === 'checking'} 
                className="w-full text-lg py-6"
              >
                {loading ? "Creazione team in corso..." : "🚀 Crea Team e Registrati"}
              </Button>
            </form>

            <Separator />

            <div className="text-center space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Hai già un account?{' '}
                  <Link to="/auth" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                    Accedi qui
                  </Link>
                </p>
                <p className="text-sm text-slate-600">
                  Hai un codice invito?{' '}
                  <Link to="/register-invite" className="text-teal-600 hover:text-teal-800 hover:underline font-medium">
                    Registrati con invito
                  </Link>
                </p>
              </div>
              
              {/* Brand footer */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Powered by <span className="font-semibold text-blue-600">ElevenBase</span> - 
                  Gestione sportiva professionale per EA Sports FC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default RegisterFounder;