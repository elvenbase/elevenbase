import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Crown, 
  Shield, 
  Gamepad2, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface EmailSentState {
  email?: string;
  flow?: 'founder' | 'invite';
  teamData?: {
    teamName: string;
    teamAbbreviation: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

const EmailSent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as EmailSentState | null;

  const getFlowIcon = () => {
    switch (state?.flow) {
      case 'founder':
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 'invite':
        return <Shield className="w-8 h-8 text-blue-500" />;
      default:
        return <Gamepad2 className="w-8 h-8 text-green-500" />;
    }
  };

  const getFlowTitle = () => {
    switch (state?.flow) {
      case 'founder':
        return 'Registrazione Founder';
      case 'invite':
        return 'Registrazione con Invito';
      default:
        return 'Registrazione';
    }
  };

  const getFlowDescription = () => {
    switch (state?.flow) {
      case 'founder':
        return `Il tuo team "${state?.teamData?.teamName}" sarà creato automaticamente dopo la conferma email.`;
      case 'invite':
        return 'Sarai aggiunto al team dopo la conferma email e l\'approvazione dell\'admin.';
      default:
        return 'La tua registrazione sarà completata dopo la conferma email.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Email Inviata!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Controlla la tua casella di posta elettronica
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informazioni sul flusso */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {getFlowIcon()}
                <h3 className="font-semibold text-gray-900">{getFlowTitle()}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {getFlowDescription()}
              </p>
            </div>

            {/* Email di destinazione */}
            {state?.email && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Email inviata a:</strong><br />
                  {state.email}
                </AlertDescription>
              </Alert>
            )}

            {/* Dettagli team per founder */}
            {state?.flow === 'founder' && state?.teamData && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🏆 Dettagli Team
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Nome:</strong> {state.teamData.teamName}</p>
                  <p><strong>Abbreviazione:</strong> {state.teamData.teamAbbreviation}</p>
                </div>
              </div>
            )}

            {/* Istruzioni */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                📧 Prossimi passi:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Controlla la tua casella di posta elettronica</li>
                <li>Cerca un'email da Elevenbase (controlla anche lo spam)</li>
                <li>Clicca sul link di conferma nell'email</li>
                <li>
                  {state?.flow === 'founder' 
                    ? 'Il tuo team sarà creato automaticamente'
                    : 'Attendi l\'approvazione dell\'admin del team'
                  }
                </li>
              </ol>
            </div>

            {/* Azioni */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
                variant="default"
              >
                Vai al Login
              </Button>
              
              <Button 
                onClick={() => navigate('/register-founder')}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Registrazione
              </Button>
            </div>

            {/* Supporto */}
            <div className="text-center text-xs text-gray-500">
              Non hai ricevuto l'email? Controlla la cartella spam o 
              <button 
                onClick={() => navigate('/register-founder')}
                className="text-blue-600 hover:underline ml-1"
              >
                riprova la registrazione
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailSent;