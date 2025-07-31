import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Squad from "./pages/Squad";
import Trials from "./pages/Trials";
import Competitions from "./pages/Competitions";
import Training from "./pages/Training";
import PublicRegistration from './pages/PublicRegistration';
import PublicSession from './pages/PublicSession';
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TrialsKanban from "./components/TrialsKanban";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/public-registration/:token" element={<PublicRegistration />} />
              <Route path="/session/:token" element={<PublicSession />} />
              
              {/* Protected routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/squad" element={<Squad />} />
                    <Route path="/trials" element={<Trials />} />
                    <Route path="/trials-kanban" element={<TrialsKanban />} />
                    <Route path="/competitions" element={<Competitions />} />
                    <Route path="/training" element={<Training />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;