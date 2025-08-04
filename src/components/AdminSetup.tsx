
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, CheckCircle } from 'lucide-react';

interface AdminSetupProps {
  onSetupComplete: () => void;
}

const AdminSetup = ({ onSetupComplete }: AdminSetupProps) => {
  const [step, setStep] = useState<'check' | 'register' | 'setup' | 'complete'>('check');
  const [setupToken, setSetupToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    setupToken: ''
  });
  
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();

  useEffect(() => {
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    try {
      setLoading(true);
      
      // Check if admin setup is needed
      const { data: setupData } = await supabase
        .from('admin_setup')
        .select('setup_token')
        .eq('is_completed', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (setupData?.setup_token) {
        setSetupToken(setupData.setup_token);
        setStep('register');
      } else {
        // Try to initialize admin setup
        const { data: token, error } = await supabase.rpc('initialize_admin_setup');
        
        if (error) {
          console.error('Error initializing admin setup:', error);
          toast({
            title: "Errore",
            description: "Impossibile inizializzare il setup amministratore",
            variant: "destructive",
          });
          return;
        }
        
        if (token) {
          setSetupToken(token);
          setStep('register');
        } else {
          // Admin already exists
          onSetupComplete();
        }
      }
    } catch (error) {
      console.error('Error checking admin setup:', error);
      onSetupComplete(); // Fallback to normal auth
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 8 caratteri",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, formData.username);
      
      if (error) {
        return;
      }

      toast({
        title: "Registrazione completata",
        description: "Ora puoi procedere con il setup dell'amministratore",
      });
      
      setStep('setup');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.setupToken !== setupToken) {
      toast({
        title: "Errore",
        description: "Token di setup non valido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // First sign in with the created account
      const { error: signInError } = await signIn(formData.email, formData.password);
      
      if (signInError) {
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non trovato",
          variant: "destructive",
        });
        return;
      }

      // Complete admin setup
      const { data: success, error } = await supabase.rpc('complete_admin_setup', {
        _setup_token: setupToken,
        _user_id: user.id
      });

      if (error || !success) {
        toast({
          title: "Errore",
          description: "Impossibile completare il setup amministratore",
          variant: "destructive",
        });
        return;
      }

      setStep('complete');
      
      setTimeout(() => {
        onSetupComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Admin setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'check') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifica setup amministratore...</p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success" />
              <h2 className="text-2xl font-bold mb-2">Setup Completato!</h2>
              <p className="text-muted-foreground">
                L'amministratore è stato configurato con successo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>
            {step === 'register' ? 'Crea Account Amministratore' : 'Setup Amministratore'}
          </CardTitle>
          <CardDescription>
            {step === 'register' 
              ? 'Crea il primo account amministratore del sistema'
              : 'Inserisci il token per completare il setup'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="username">Nome Utente</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Conferma Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registrazione...' : 'Registrati'}
              </Button>
            </form>
          )}
          
          {step === 'setup' && (
            <form onSubmit={handleAdminSetup} className="space-y-4">
              <div>
                <Label htmlFor="setupToken">Token di Setup</Label>
                <Input
                  id="setupToken"
                  type="text"
                  required
                  placeholder="Inserisci il token di setup"
                  value={formData.setupToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, setupToken: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Il token è: <code className="bg-muted px-2 py-1 rounded">{setupToken}</code>
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Completamento Setup...' : 'Completa Setup'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
