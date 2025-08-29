import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { registrationStatus, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefreshStatus = async () => {
    // Ricarica la pagina per verificare se lo status è cambiato
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            In Attesa di Approvazione
          </CardTitle>
          <CardDescription className="text-gray-600">
            La tua registrazione è stata completata con successo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Team */}
          {registrationStatus?.team_name && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                <Users className="w-4 h-4" />
                Team: {registrationStatus.team_name}
              </div>
              <p className="text-blue-600 text-sm">
                Ruolo richiesto: <span className="font-medium capitalize">{registrationStatus.role}</span>
              </p>
            </div>
          )}

          <Separator />

          {/* Messaggio principale */}
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-gray-800">
              🎯 Prossimi Passi
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Il <strong>fondatore</strong> o un <strong>amministratore</strong> del team deve approvare 
              la tua richiesta di accesso prima che tu possa utilizzare la piattaforma.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Mail className="w-3 h-3" />
                Riceverai una notifica email quando sarai approvato
              </p>
            </div>
          </div>

          <Separator />

          {/* Azioni */}
          <div className="space-y-3">
            <Button 
              onClick={handleRefreshStatus}
              variant="outline" 
              className="w-full"
            >
              🔄 Controlla Status
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="ghost" 
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Esci e Torna al Login
            </Button>
          </div>

          {/* Footer info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Problemi? Contatta il fondatore del team per assistenza
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;