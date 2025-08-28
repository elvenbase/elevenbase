import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Crown, Users, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RegisterFounder = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    teamName: '',
    teamAbbreviation: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    acceptPrivacy: false,
    acceptNewsletter: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // 1. Registrazione utente su Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm?type=signup&flow=founder`,
          data: { 
            username: formData.username,
            team_name: formData.teamName,
            team_abbreviation: formData.teamAbbreviation,
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
            _secondary_color: formData.secondaryColor
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
          
          navigate('/confirm', { 
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Crea il tuo Team</CardTitle>
            <CardDescription className="text-lg">
              Registrati come <span className="font-semibold text-blue-600">Founder</span> e inizia a gestire la tua squadra
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      required
                      placeholder="il_tuo_username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Conferma Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
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
                    <Input
                      id="teamAbbreviation"
                      value={formData.teamAbbreviation}
                      onChange={(e) => handleInputChange('teamAbbreviation', e.target.value.toUpperCase())}
                      required
                      placeholder="FCE"
                      maxLength={10}
                    />
                  </div>
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

              <Button type="submit" disabled={loading || !formData.acceptPrivacy} className="w-full text-lg py-6">
                {loading ? "Creazione team in corso..." : "🚀 Crea Team e Registrati"}
              </Button>
            </form>

            <Separator />

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Hai già un account?{' '}
                <Link to="/auth" className="text-blue-600 hover:underline font-medium">
                  Accedi qui
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Hai un codice invito?{' '}
                <Link to="/register-invite" className="text-green-600 hover:underline font-medium">
                  Registrati con invito
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterFounder;