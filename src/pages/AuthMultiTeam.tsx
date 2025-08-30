import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { toast } from "sonner";

const AuthMultiTeam = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { logoUrl: globalLogo } = useSiteAssets();
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Grande */}
        <div className="text-center mb-12">
          {globalLogo ? (
            <img 
              src={globalLogo}
              alt="Platform Logo"
              className="h-32 w-32 mx-auto object-contain"
              onError={(e) => {
                // Fallback al SiteLogo se il logo globale fallisce
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const fallbackDiv = img.nextElementSibling as HTMLElement;
                if (fallbackDiv) fallbackDiv.style.display = 'block';
              }}
            />
          ) : null}
          <div style={{ display: globalLogo ? 'none' : 'block' }}>
            <SiteLogo 
              className="h-32 w-auto mx-auto" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo_elevenBase.png' }}
            />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pt-6 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight mb-2">Accedi alla Piattaforma</CardTitle>
            <CardDescription className="mt-2 mb-4 leading-relaxed">Inserisci le tue credenziali per accedere a ElevenBase</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Form */}
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
            <div className="pt-4 border-t text-center space-y-2">
              <a
                href="/reset-password"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Hai dimenticato la password?
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground mb-3">
            Nuovi alla piattaforma?
          </div>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline font-medium"
          >
            🚀 Scopri tutto su ElevenBase
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthMultiTeam;