
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useEffect, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ErrorBoundary";

// Import components
import { AdminSetup } from "@/components/AdminSetup";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/components/layout/AppLayout";

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Squad = lazy(() => import("@/pages/Squad"));
const Training = lazy(() => import("@/pages/Training"));
const SessionManagement = lazy(() => import("@/pages/SessionManagement"));
// const Competitions = lazy(() => import("@/pages/Competitions"));
const Matches = lazy(() => import("@/pages/Matches"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const MatchLive = lazy(() => import("@/pages/MatchLive"));
const Formations = lazy(() => import("@/pages/Formations"));
const Trials = lazy(() => import("@/pages/Trials"));
const TrialEvaluations = lazy(() => import("@/pages/TrialEvaluations"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const FieldOptionsManagement = lazy(() => import("@/pages/FieldOptionsManagement"));
const PublicRegistration = lazy(() => import("@/pages/PublicRegistration"));
const MatchPublicRegistration = lazy(() => import("@/pages/MatchPublicRegistration"));
const PublicSession = lazy(() => import("@/pages/PublicSession"));
const EmailConfirm = lazy(() => import("@/pages/EmailConfirm"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PlayerDetail = lazy(() => import("@/pages/PlayerDetail"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const FormationManagement = lazy(() => import("@/pages/admin/FormationManagement"));
const JerseyManagement = lazy(() => import("@/pages/admin/JerseyManagement"));
const AvatarBackgroundManagement = lazy(() => import("@/pages/admin/AvatarBackgroundManagement"));
const PngSettingsManagement = lazy(() => import("@/pages/admin/PngSettingsManagement"));
const OpponentsManagement = lazy(() => import("@/pages/admin/OpponentsManagement"));

const queryClient = new QueryClient();

function App() {
  const [needsAdminSetup, setNeedsAdminSetup] = useState<boolean | null>(null);
  
  useEffect(() => {
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    // TEMPORARY BYPASS - Skip admin setup check
    console.log('Bypassing admin setup check - allowing direct access');
    setNeedsAdminSetup(false);
    
    // Original code commented out for now
    /*
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
    */
  };

  // TEMPORARY BYPASS - Always show main app
  console.log('Bypassing admin setup - showing main app directly');
  
  /*
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
  */

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <div className="min-h-screen bg-background">
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-background">
                      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/confirm" element={<EmailConfirm />} />
                      <Route path="/register/:token" element={<PublicRegistration />} />
                      <Route path="/m/:token" element={<MatchPublicRegistration />} />
                      <Route path="/session/:token" element={<PublicSession />} />
                      <Route path="/" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Dashboard />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Dashboard />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/squad" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Squad />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/training" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Training />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/sessions" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <SessionManagement />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/training/session/:id" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <SessionManagement />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      {/* Matches */}
                      <Route path="/matches" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Matches />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/match/:id" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <MatchDetail />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/match/:id/live" element={
                        <ProtectedRoute>
                          <main className="transition-all duration-200">
                            <MatchLive />
                          </main>
                        </ProtectedRoute>
                      } />
                      <Route path="/formations" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Formations />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/trials" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Trials />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/trial-evaluations" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <TrialEvaluations />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/users" element={
                        <AdminRoute>
                          <AppLayout>
                            <UserManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/field-options" element={
                        <AdminRoute>
                          <AppLayout>
                            <FieldOptionsManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/player/:id" element={
                        <ProtectedRoute>
                          <AppLayout>
                            <PlayerDetail />
                          </AppLayout>
                        </ProtectedRoute>
                      } />
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AppLayout>
                            <AdminDashboard />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/admin/users" element={
                        <AdminRoute>
                          <AppLayout>
                            <UserManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/admin/formations" element={
                        <AdminRoute>
                          <AppLayout>
                            <FormationManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/admin/jerseys" element={
                        <AdminRoute>
                          <AppLayout>
                            <JerseyManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/admin/avatar-backgrounds" element={
                        <AdminRoute>
                          <AppLayout>
                            <AvatarBackgroundManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/admin/png-settings" element={
                        <AdminRoute>
                          <AppLayout>
                            <PngSettingsManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="/admin/opponents" element={
                        <AdminRoute>
                          <AppLayout>
                            <OpponentsManagement />
                          </AppLayout>
                        </AdminRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </div>
              </ErrorBoundary>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
