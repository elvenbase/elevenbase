
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    try {
      // Se l'input contiene una @ è un'email, altrimenti è un username
      if (username.includes('@')) {
        // È un'email, usa direttamente
        await signIn(username, password);
      } else {
        // È un username, converti in email fake
        const email = `${username.toLowerCase()}@users.com`;
        await signIn(email, password);
      }
    } catch (error) {
      toast.error('Errore durante il login');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
    
    await signUp(email, password, username);
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
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src={`/assets/IMG_0055.png?v=${import.meta.env?.VITE_APP_VERSION || Date.now()}`}
              alt="Logo"
              className="h-32 w-auto"
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = '/assets/logo_elevenBase.png' }}
            />
          </div>
          <p className="text-muted-foreground">E-sport Management System</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle>{isSignUp ? "Registrazione" : "Accesso"}</CardTitle>
            <CardDescription>
              {isSignUp ? "Crea il tuo account amministratore" : "Accedi al sistema di gestione e-sport"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {isSignUp ? (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="admin"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registrazione in corso..." : "Registrati"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="admin"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Accesso in corso..." : "Accedi"}
                  </Button>
                </form>
              )}
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

export default Auth;
