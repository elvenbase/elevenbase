import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Trophy, 
  BarChart3, 
  Shield, 
  Zap, 
  Heart,
  ArrowRight,
  CheckCircle,
  UserPlus,
  Crown,
  Mail
} from 'lucide-react';

const Index = () => {
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();

  const handleJoinTeam = () => {
    if (inviteCode.trim()) {
      navigate(`/auth/register-invite?code=${inviteCode.trim()}`);
    }
  };

  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Gestione Squadra",
      description: "Organizza i tuoi giocatori, staff tecnico e membri del team in un'unica piattaforma."
    },
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: "Statistiche & Analisi",
      description: "Monitora le performance, analizza i dati e migliora le prestazioni della squadra."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      title: "Allenamenti & Convocazioni",
      description: "Programma sessioni di allenamento e gestisci le convocazioni per le partite."
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      title: "Sicurezza & Privacy",
      description: "I tuoi dati sono protetti con tecnologie di sicurezza all'avanguardia."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              <Zap className="h-4 w-4 mr-1" />
              Piattaforma di Gestione Sportiva
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Benvenuto su <span className="text-yellow-300">ElevenBase</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              La piattaforma completa per gestire la tua squadra di calcio. 
              Dalle convocazioni alle statistiche, tutto in un unico posto.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth/register-founder">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3">
                  <Crown className="h-5 w-5 mr-2" />
                  Fonda il Tuo Team
                </Button>
              </Link>
              <span className="text-blue-100 text-sm">oppure</span>
              <div className="flex gap-2">
                <Input
                  placeholder="Inserisci codice invito..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinTeam()}
                />
                <Button 
                  variant="outline" 
                  onClick={handleJoinTeam}
                  disabled={!inviteCode.trim()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Unisciti
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1993&q=80"
            alt="Football Team"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      </div>

      {/* Two Paths Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Due Modi per Iniziare
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scegli il percorso più adatto a te: crea il tuo team da zero o unisciti a uno esistente
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Founder Path */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Fonda il Tuo Team</CardTitle>
              <CardDescription className="text-lg">
                Sei un allenatore, dirigente o capitano? Crea il tuo team da zero
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Crea il team con nome, colori e logo personalizzati</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Invita giocatori, staff e amministratori</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Controllo completo su tutte le funzionalità</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Gestisci allenamenti, partite e statistiche</span>
                </div>
              </div>
              <Link to="/auth/register-founder" className="block mt-6">
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                  Inizia Come Founder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Join Team Path */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Unisciti a un Team</CardTitle>
              <CardDescription className="text-lg">
                Hai ricevuto un invito? Entra a far parte di un team esistente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Registrati con il codice invito ricevuto</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Ruoli: Giocatore, Amministratore o Staff</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Accesso immediato dopo approvazione</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Connessione EA Sports FC per giocatori</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <Input
                  placeholder="Il tuo codice invito..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="text-center font-mono"
                />
                <Button 
                  className="w-full" 
                  onClick={handleJoinTeam}
                  disabled={!inviteCode.trim()}
                >
                  Unisciti al Team
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tutto ciò di cui hai bisogno
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una piattaforma completa per gestire ogni aspetto della tua squadra
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto a iniziare?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Unisciti alle squadre che stanno già utilizzando ElevenBase per migliorare le loro performance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register-founder">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                <Crown className="h-5 w-5 mr-2" />
                Crea il Tuo Team
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                <Mail className="h-5 w-5 mr-2" />
                Hai già un account?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
