
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useEffect, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";

// Import components
import AdminSetup from "@/components/AdminSetup";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Navigation from "@/components/Navigation";

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Squad = lazy(() => import("@/pages/Squad"));
const Training = lazy(() => import("@/pages/Training"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
const Competitions = lazy(() => import("@/pages/Competitions"));
const Formations = lazy(() => import("@/pages/Formations"));
const Trials = lazy(() => import("@/pages/Trials"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const PublicRegistration = lazy(() => import("@/pages/PublicRegistration"));
const PublicSession = lazy(() => import("@/pages/PublicSession"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function App() {
  const [needsAdminSetup, setNeedsAdminSetup] = useState<boolean | null>(null);
  
  useEffect(() => {
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    try {
      // Check if any superadmin exists
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'superadmin')
        .limit(1);

      if (error) {
        console.error('Error checking admin setup:', error);
        setNeedsAdminSetup(false);
        return;
      }

      // If no superadmin exists, check if setup is available
      if (!data || data.length === 0) {
        const { data: setupData } = await supabase
          .from('admin_setup')
          .select('setup_token')
          .eq('is_completed', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        setNeedsAdminSetup(true);
      } else {
        setNeedsAdminSetup(false);
      }
    } catch (error) {
      console.error('Error in admin setup check:', error);
      setNeedsAdminSetup(false);
    }
  };

  if (needsAdminSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsAdminSetup) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <AuthProvider>
              <AdminSetup onSetupComplete={() => setNeedsAdminSetup(false)} />
              <Toaster />
              <Sonner />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/register/:token" element={<PublicRegistration />} />
                    <Route path="/session/:token" element={<PublicSession />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Dashboard />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Dashboard />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/squad" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Squad />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/training" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Training />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/sessions" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <SessionManagement />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/training/session/:id" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <SessionManagement />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/competitions" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Competitions />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/formations" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Formations />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/trials" element={
                      <ProtectedRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <Trials />
                        </main>
                      </ProtectedRoute>
                    } />
                    <Route path="/users" element={
                      <AdminRoute>
                        <Navigation />
                        <main className="ml-0 transition-all duration-200">
                          <UserManagement />
                        </main>
                      </AdminRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
